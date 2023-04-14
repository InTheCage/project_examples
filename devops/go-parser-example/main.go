var (
	proxy  Proxy
	random = rand.New(rand.NewSource(time.Now().Unix()))
)

func praseUrls(proxies ...string) (urls []*url.URL) {
	for _, proxy := range proxies {
		u, err := url.Parse(proxy)
		if err != nil {
			log.Ctx().Fatal(err)
		}
		urls = append(urls, u)
	}
	return
}

func roundRobin() func(*http.Request) (*url.URL, error) {
	var (
		i, lenUrls = 0, len(proxy.urls)
	)
	return func(r *http.Request) (*url.URL, error) {
		proxy.mutex.Lock()
		i = (i + 1) % lenUrls
		u := proxy.urls[i]
		proxy.mutex.Unlock()
		return u, nil
	}
}

func main() {
	var (
		err     error
		start   = time.Now()
		ch      = make(chan bool)
		secrets Secrets
	)
	log.Init()
	log.Ctx().Info(`[*] - start parse`)

	if !init_secrets(&secrets) {
		log.Ctx().Error(`one or more secrets empty or not exists`)
		log.Ctx().Info(`[*] - parse end, time parsing: `, time.Now().Sub(start))
	}
	if err = proxy.init(secrets); err != nil {
		log.Ctx().Error(err)
		return
	}
	go func(secrets Secrets, ch chan bool) {
		update_cryptorank(secrets)
		ch <- true
	}(secrets, ch)
	<-ch
	log.Ctx().Info(`[*] - parse end, time parsing: `, time.Now().Sub(start))
}

func init_secrets(secrets *Secrets) bool {
	secrets.rabbit_host = os.Getenv(`rabbit`)
	secrets.proxy_auth = os.Getenv(`proxy`)
	log.Ctx().Info(`rabbit - `, secrets.rabbit_host)
	log.Ctx().Info(`proxy - `, secrets.proxy_auth)
	return secrets.rabbit_host != `` && secrets.proxy_auth != ``
}

func get_data(source string, dist interface{}) error {
	var (
		err    error
		client = http.DefaultClient
		req    *http.Request
		resp   *http.Response
	)
	proxy.mutex.Lock()
	random.Shuffle(len(proxy.urls), func(i, j int) {
		proxy.urls[i], proxy.urls[j] = proxy.urls[j], proxy.urls[i]
	})
	proxy.mutex.Unlock()

	proxyFn := roundRobin()
	client.Transport = &http.Transport{Proxy: proxyFn}
	client.Timeout = 15 * time.Second
	if req, err = http.NewRequest(`GET`, source, nil); err != nil {
		log.Ctx().Error(err)
		return err
	}
	req.Header.Set(`connection`, `close`)
	req.Header.Set(`accept`, `application/json`)
	req.Header.Set(`user-agent`, `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36`)

	for i := 0; i < 10; i++ {
		if resp, err = client.Do(req); err != nil {
			if !errors.Is(err, context.DeadlineExceeded) && !os.IsTimeout(err) {
				log.Ctx().Error(`i = `, i, `, `, err)
			}
			continue
		}
		defer resp.Body.Close()
		switch resp.StatusCode {
		case http.StatusOK:
			if err = json.NewDecoder(resp.Body).Decode(&dist); err != nil {
				if !errors.Is(err, context.DeadlineExceeded) && !os.IsTimeout(err) {
					log.Ctx().Error(`i = `, i, `, `, err)
				}
				continue
			}
			return nil
		default:
			err = errors.New(resp.Status + ` - ` + source)
			log.Ctx().Error(`i = `, i, `, `, err)
			continue
		}
	}
	return err
}

func update_cryptorank(secrets Secrets) {
	var (
		err      error
		coin_map struct {
			Data []Cryptorank_token `json:"data"`
		}
		coin_tag struct {
			Data []Cryptorank_tag `json:"data"`
		}
		platforms struct {
			Data []Platform `json:"data"`
		}
		out      []Cryptorank_token
		p_tokens = make(map[string][]struct {
			Name   string `json:"name"`
			Symbol string `json:"symbol"`
		})

		mutex      sync.Mutex
		wg         sync.WaitGroup
		ch         = make(chan struct{}, 100)
		crowdsales = make(map[string][]CrowdSale)
	)
	if err = get_data(``, &coin_tag); err != nil {
		log.Ctx().Error(err)
		return
	}
	if err = get_data(``, &coin_map); err != nil {
		log.Ctx().Error(err)
		return
	}
	for i, v := range coin_map.Data {
		if v.LifeCycle == `traded` {
			for _, t := range v.TagIds {
				for _, e := range coin_tag.Data {
					if e.Id == t {
						coin_map.Data[i].Tags = append(coin_map.Data[i].Tags, strings.ToLower(e.Name))
						break
					}
				}
			}
			out = append(out, coin_map.Data[i])
		}
	}
	if err = get_data(``, &platforms); err != nil {
		log.Ctx().Error(err)
		return
	}

	for _, v := range platforms.Data {
		ch <- struct{}{}
		wg.Add(1)
		go func(v Platform, wg *sync.WaitGroup, ch <-chan struct{}) {
			defer wg.Done()
			var (
				tokens struct {
					Data []Cryptorank_token `json:"data"`
				}
				keys []string
				buf  struct {
					Data map[string][]CrowdSale `json:"data"`
				}
			)
			if err = get_data(fmt.Sprintf(`%d&`, v.Id), &tokens); err != nil {
				log.Ctx().Error(err)
				<-ch
				return
			}
			for _, t := range tokens.Data {
				keys = append(keys, t.Key)
				p_tokens[strings.ToLower(v.Key)] = append(p_tokens[strings.ToLower(v.Key)], struct {
					Name   string `json:"name"`
					Symbol string `json:"symbol"`
				}{Name: t.Name, Symbol: t.Symbol})
			}
			if len(keys) > 0 {
				if err = get_data(fmt.Sprintf(`keys=%s`, strings.Join(keys, `,`)), &buf); err != nil {
					log.Ctx().Error(err)
					<-ch
					return
				}
				mutex.Lock()
				for k, c := range buf.Data {
					crowdsales[k] = c
				}
				mutex.Unlock()
			}
			<-ch
		}(v, &wg, ch)
	}

	wg.Wait()
	close(ch)
	if err = upload(coin_tag.Data, `tags`, secrets); err != nil {
		log.Ctx().Error(err)
	}

	if err = upload(out, `dim`, secrets); err != nil {
		log.Ctx().Error(err)
	}
	if err = upload(platforms.Data, `platforms`, secrets); err != nil {
		log.Ctx().Error(err)
	}
	if err = upload(p_tokens, `platforms_tokens`, secrets); err != nil {
		log.Ctx().Error(err)
	}
	if err = upload(crowdsales, `crowdsales`, secrets); err != nil {
		log.Ctx().Error(err)
	}
}

func upload(data interface{}, header string, secrets Secrets) error {
	var (
		err  error
		conn *amqp.Connection
		ch   *amqp.Channel
		body []byte
	)
	const stream = `cryptorank`
	if conn, err = amqp.Dial(secrets.rabbit_host); err != nil {
		return err
	}
	if ch, err = conn.Channel(); err != nil {
		log.Ctx().Error(err)
		if err = conn.Close(); err != nil {
			log.Ctx().Error(err)
		}
		return err
	}
	if _, err = ch.QueueDeclare(stream, true, false, false, false, nil); err != nil {
		return err
	}
	if body, err = json.Marshal(data); err != nil {
		return err
	}
	msg := amqp.Publishing{
		Headers:      amqp.Table{`id`: header},
		DeliveryMode: amqp.Persistent,
		Timestamp:    time.Now(),
		ContentType:  `text/plain`,
		Body:         body,
	}
	if err = ch.Publish(``, stream, false, false, msg); err != nil {
		return err
	}
	if err = ch.Close(); err != nil {
		log.Ctx().Error(err)
	}
	if err = conn.Close(); err != nil {
		log.Ctx().Error(err)
	}
	return nil
}

func (src *Proxy) init(secrets Secrets) error {
	var (
		err  error
		req  *http.Request
		resp *http.Response
		auth = secrets.proxy_auth
	)
	if len(auth) > 0 {
		if req, err = http.NewRequest(`GET`, `proxy`, nil); err != nil {
			log.Ctx().Error(err)
			return err
		}
		q := req.URL.Query()
		q.Set(`format`, `txt`)
		q.Set(`type`, `http_auth`)

		q.Set(`login`, strings.Split(auth, `:`)[0])
		q.Set(`password`, strings.Split(auth, `:`)[1])
		req.URL.RawQuery = q.Encode()
		if resp, err = http.DefaultClient.Do(req); err != nil {
			log.Ctx().Error(err)
			return err
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			log.Ctx().Error(resp.Status)
			return errors.New(resp.Status)
		}
		var (
			body []byte
			buf  string
			arr  []string
		)
		if body, err = ioutil.ReadAll(resp.Body); err != nil {
			log.Ctx().Error(err)
			return err
		}
		buf = string(body)
		arr = strings.Split(buf, "\n")
		arr = arr[:len(arr)-1]
		for _, v := range arr {
			src.Proxies = append(src.Proxies, `http://`+auth+`@`+v)
		}
		src.urls = praseUrls(src.Proxies...)
	}
	return err
}
