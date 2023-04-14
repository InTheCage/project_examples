
func (src *API) UserStatistics(id, status int64) (UserStats, error) {
	var (
		conn  driver.Conn
		err   error
		ctx   context.Context
		buf   []UserStats
		query string
		opt   *clickhouse.Options
	)

	if opt, err = clickhouse.ParseDSN(src.secrets.click_host); err != nil {
		log.Ctx().Error(err)
		return UserStats{}, err
	}
	opt.DialTimeout = time.Minute
	opt.MaxOpenConns = 55
	opt.MaxIdleConns = 50
	opt.ConnMaxLifetime = time.Hour
	opt.Compression = &clickhouse.Compression{Method: clickhouse.CompressionLZ4}
	opt.Settings = clickhouse.Settings{
		`max_execution_time`: 60,
		`max_block_size`:     1_048_576,
	}
	opt.Debug = false
	if conn, err = clickhouse.Open(opt); err != nil {
		log.Ctx().Error(err)
		return UserStats{}, err
	}
	ctx = clickhouse.Context(context.Background())

	if err = conn.Ping(ctx); err != nil {
		if exception, ok := err.(*clickhouse.Exception); ok {
			fmt.Printf("Catch exception [%d] %s \n%s\n", exception.Code, exception.Message, exception.StackTrace)
		}

		return UserStats{}, err
	}

	switch status {
	case 0:
		query = `select member_id as id, sum(countSearchToken) as SearchCount, sum(compareTokens) as CompareCount from metrics group by id`
		if err = conn.Select(ctx, &buf, query); err != nil {
			log.Ctx().Error(err)
			return UserStats{}, err
		}
	case 1:
		now := time.Now()
		currentYear, currentMonth, _ := now.Date()
		currentLocation := now.Location()
		var (
			startDate  = time.Date(currentYear, currentMonth, 1, 0, 0, 0, 0, currentLocation)
			collection = src.Mongo.Database(`External`).Collection(`pay_orders`)
			opts       = options.Find().SetSort(bson.D{{`date`, -1}}).SetLimit(1)
			cursor     *mongo.Cursor
		)
		if cursor, err = collection.Find(context.TODO(), bson.M{`login`: id}, opts); err == nil {
			var results []struct {
				Id   int64     `bson:"login"`
				Date time.Time `bson:"date"`
			}
			if err = cursor.All(context.TODO(), &results); err == nil {
				if len(results) == 1 {
					startDate = results[0].Date
				}
			} else {
				log.Ctx().Error(err)
			}
		} else {
			log.Ctx().Error(err)
		}
		query = `select member_id as id, sum(countSearchToken) as SearchCount, sum(compareTokens) as CompareCount from metrics where EventDate >= $1 group by id`
		if err = conn.Select(ctx, &buf, query, startDate); err != nil {
			log.Ctx().Error(err)
			return UserStats{}, err
		}
	}
	for _, u := range buf {
		if u.Id == uint64(id) {
			return u, nil
		}
	}
	return UserStats{SearchCount: 0}, nil
}

// Search - поиск по SearchType и подготовка выдачи на основе ответа CoinsSearch
func (src *API) Search(w http.ResponseWriter, r *http.Request) {
	type Row struct {
		Name      string  `json:"name,omitempty"`
		Text      string  `json:"text,omitempty"`
		Favourite bool    `json:"favourite,omitempty"`
		Portfolio bool    `json:"portfolio,omitempty"`
		Scores    float64 `json:"scores,omitempty"`
		Price     float64 `json:"price,omitempty"`
	}

	var (
		err error
		in  struct {
			ID     int64      `json:"id,omitempty"`
			Text   string     `json:"text,omitempty"`
			Locale string     `json:"locale,omitempty"`
			Type   SearchType `json:"type,omitempty"`
			Status int64      `json:"status,omitempty"`
			IsFull bool       `json:"isFull,omitempty"`
		}
		answ struct {
			Result []Row `json:"result"`
			Limit  int64 `json:"limit"`
		}
		searchData map[string]map[string]string
		collection *mongo.Collection
	)

	if err = json.NewDecoder(r.Body).Decode(&in); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Ctx().Error(err)
		return
	}

	if in.Status < 2 {
		var stats UserStats
		if stats, err = src.UserStatistics(in.ID, in.Status); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			log.Ctx().Error(err)
			return
		}
		switch in.Status {
		case 0:
			if stats.SearchCount >= 10 {
				answ.Limit = 0
			} else {
				answ.Limit = int64(10 - stats.SearchCount)
			}
		case 1:
			if stats.SearchCount >= 15 {
				answ.Limit = 0
			} else {
				answ.Limit = int64(15 - stats.SearchCount)
			}
		}
		if answ.Limit == 0 {
			w.WriteHeader(http.StatusOK)
			if err = json.NewEncoder(w).Encode(answ); err != nil {
				log.Ctx().Error(err)
			}
			return
		}
	} else {
		answ.Limit = 1
	}

	// сбор метрики по поиску (таблица простая кто, что, когда)
	src.Metrics.Add(Search, in.ID, in.Text)

	searchData = src.CoinsSearch([]string{in.Text}, in.Type, in.Locale)

	if len(searchData) == 0 {
		w.WriteHeader(http.StatusOK)
		if err = json.NewEncoder(w).Encode(answ); err != nil {
			log.Ctx().Error(err)
		}

		return
	}

	collection = src.Mongo.Database("External").Collection("users")

	for name, text := range searchData {
		var (
			scores, price float64
			result        bson.M
			containsF     = false
			containsP     = false
		)

		if scores, err = strconv.ParseFloat(text[`%03`], bitSize); err != nil {
			log.Ctx().Error(err)
		}

		if price, err = strconv.ParseFloat(text[`%06`], bitSize); err != nil {
			log.Ctx().Error(err)
		}

		var template string
		switch in.Status {
		case 0:
			template = formula.TemplateByTickerUnpaid(in.Locale)
		case 1:
			template = formula.TemplateByTickerLight(in.Locale)
		case 2:
			if in.IsFull {
				template = formula.TemplateByTicker(in.Locale)
			} else {
				template = formula.TemplateByTickerPro(in.Locale)
			}
		}

		row := Row{
			Name:   name,
			Text:   template,
			Scores: scores,
			Price:  price,
		}

		for k, v := range text {
			if v == `` {
				t := ``

				switch in.Locale {
				case ru:
					t = `Н/Д`
				case en:
					t = `N/D`
				}

				row.Text = strings.Replace(row.Text, k, t, 1)
			} else {
				row.Text = strings.Replace(row.Text, k, v, 1)
			}
		}

		if err = collection.FindOne(context.Background(), bson.M{
			`userName`:           strconv.FormatInt(in.ID, baseInt),
			`favourites.` + name: bson.M{`$exists`: true}}).Decode(&result); err == nil {
			containsF = true
		} else if err != mongo.ErrNoDocuments {
			log.Ctx().Error(err)
		}

		if err = collection.FindOne(context.Background(), bson.M{
			`userName`:          strconv.FormatInt(in.ID, baseInt),
			`portfolio.` + name: bson.M{`$exists`: true}}).Decode(&result); err == nil {
			containsP = true
		} else if err != mongo.ErrNoDocuments {
			log.Ctx().Error(err)
		}

		row.Portfolio = containsP
		row.Favourite = containsF
		answ.Result = append(answ.Result, row)
	}

	sort.SliceStable(answ.Result, func(i, j int) bool {
		return answ.Result[i].Scores > answ.Result[j].Scores
	})

	w.WriteHeader(http.StatusOK)

	if err = json.NewEncoder(w).Encode(answ); err != nil {
		log.Ctx().Error(err)
	}
}

// Field - получение запроса к API серверу:
// GET - получение из mongodb информации по ID пользователя и отправка в ответ;
// POST - если запрос про токены и информации о них нет - установка счетчика в 0, если обращения были - увеличение счетчика на 1.
// В остальных случаях POST - обновление данных в mongodb
func (src *API) Field(w http.ResponseWriter, r *http.Request) {
	var (
		err error

		in struct {
			ID   int64       `json:"id"`
			Name string      `json:"field"`
			Data interface{} `json:"data,omitempty"`
		}

		collection     *mongo.Collection
		filter, result bson.M
	)

	if err = json.NewDecoder(r.Body).Decode(&in); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Ctx().Error(err)

		return
	}

	collection = src.Mongo.Database("External").Collection("users")

	filter = bson.M{"userName": strconv.FormatInt(in.ID, baseInt)}

	switch r.Method {
	case get:
		if err = collection.FindOne(context.TODO(), filter).Decode(&result); err != nil {
			if err == mongo.ErrNoDocuments {
				w.WriteHeader(http.StatusOK)
				return
			}

			w.WriteHeader(http.StatusBadRequest)
			log.Ctx().Error(err)

			return
		}

		w.WriteHeader(http.StatusOK)

		if err = json.NewEncoder(w).Encode(result[in.Name]); err != nil {
			log.Ctx().Error(err)
		}

		return
	case post:
		switch in.Name {
		case "compareTokens", "addTokenInFavourites", "removeTokenFromFavourites", "searchCategory",
			"showCompareCategory", "showCategoryList", "showTokensByFund", "showTop15",
			"showCompareTop15", "showFundsByToken", "showInvestment", "showFundsList", "showPortfolio",
			"showFavourites", "showAccount", "showNewTokens", "showCrowdloanKusama", "showICO",
			"showEvents", "showFundsHistory", "showCapital", "addTokenInPortfolio", "setSignal",
			"removeTokenFromPortfolio", "countSearchToken", "showEmission",
			"showMarketState", "compareFunds", `countPayment`, `showExchangesByToken`:
			src.Metrics.Add(Main, in.ID, in.Name)
			w.WriteHeader(http.StatusOK)

			return
		default:
			var (
				models []mongo.WriteModel
				opts   = options.BulkWrite().SetOrdered(false)
			)
			switch in.Data.(type) {
			case map[string]interface{}:
				if v, ok := in.Data.(map[string]interface{})[`status`]; ok {
					switch v.(type) {
					case float64:
						in.Data.(map[string]interface{})[`status`] = int64(v.(float64))
						models = append(models, GetUpdateOneModel(in.Name, filter, in.Data))
						models = append(models, GetUpdateOneModel(`demo_promo`, filter, `1`))
					}
				}
			default:
				models = append(models, GetUpdateOneModel(in.Name, filter, in.Data))
			}
			if _, err = collection.BulkWrite(context.Background(), models, opts); err != nil {
				log.Ctx().Error(err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			w.WriteHeader(http.StatusOK)
			return
		}
	}
}

// Promo - API промоакции
func (src *API) Promo(w http.ResponseWriter, r *http.Request) {
	var (
		err error
		in  struct {
			Promo string `json:"code"`
			ID    int64  `json:"id"`
		}
		collection     *mongo.Collection
		filter, update bson.M
		opts           = options.Update().SetUpsert(true)
	)

	if err = json.NewDecoder(r.Body).Decode(&in); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Ctx().Error(err)
		return
	}

	collection = src.Mongo.Database("External").Collection("promo")
	filter = bson.M{"name": in.Promo}

	switch r.Method {
	case get:
		var (
			cursor  *mongo.Cursor
			results []bson.M
		)
		if cursor, err = collection.Find(context.TODO(), filter); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			log.Ctx().Error(err)
			return
		}
		if err = cursor.All(context.TODO(), &results); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			log.Ctx().Error(err)
			return
		}

		if len(results) > 0 {
			w.WriteHeader(http.StatusOK)
			if err = json.NewEncoder(w).Encode(results[0]); err != nil {
				log.Ctx().Error(err)
			}
			return
		}
		w.WriteHeader(http.StatusNotFound)
		return
	case post:
		update = bson.M{`$addToSet`: bson.M{`users`: in.ID}}

		if _, err = collection.UpdateOne(context.TODO(), filter, update, opts); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			log.Ctx().Error(err)
			return
		}
		src.Metrics.Add(Promo, in.ID, in.Promo)
		w.WriteHeader(http.StatusOK)
		return
	default:
		log.Info(r.Method)
		w.WriteHeader(http.StatusBadRequest)
	}
}

// User - по методу GET - получение пользователя.
// PUT - создание пользования.
func (src *API) User(w http.ResponseWriter, r *http.Request) {
	var (
		err                         error
		collection, collectionPromo *mongo.Collection
		cursor                      *mongo.Cursor
		filter, result, filterPromo bson.M
		results                     []bson.M
		in                          struct {
			ID        int64  `json:"id,omitempty"`
			Locale    string `json:"locale,omitempty"`
			Mode      string `json:"mode,omitempty"`
			CountDays int64  `json:"count,omitempty"`
			Subscribe struct {
				Count     int64 `bson:"count,omitempty"`
				DateStart int64 `bson:"dateStart,omitempty"`
				DateEnd   int64 `bson:"dateEnd,omitempty"`
				Status    int64 `bson:"status,omitempty"`
			} `bson:"subscribe,omitempty"`
		}
	)

	if err = json.NewDecoder(r.Body).Decode(&in); err != nil {
		log.Ctx().Error(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	w.Header().Set(`Content-Type`, `application/json`)

	collection = src.Mongo.Database(`External`).Collection(`users`)
	collectionPromo = src.Mongo.Database(`External`).Collection(`promo`)
	filter = bson.M{`userName`: strconv.FormatInt(in.ID, baseInt)}
	filterPromo = bson.M{`users`: bson.M{`$in`: bson.A{in.ID}}, `expression.days`: bson.M{`$gt`: 0}}

	switch r.Method {
	case get:
		switch in.Mode {
		case `check`:
			var (
				subscribe = map[string]interface{}{}
				mTime     time.Time
				result    = map[string]interface{}{}
			)
			if err = collection.FindOne(context.TODO(), filter).Decode(&result); err != nil {
				if err == mongo.ErrNoDocuments {
					w.WriteHeader(http.StatusOK)
					if err = json.NewEncoder(w).Encode(0); err != nil {
						log.Ctx().Error(err)
					}
					return
				}
				log.Ctx().Error(err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			// проверка interface conversion
			if _, ok := result[`subscribe`].(map[string]interface{}); !ok {
				log.Ctx().Debug(`it's error! interface is: `, result)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			subscribe = result[`subscribe`].(map[string]interface{})
			if subscribe[`status`] != nil {
				switch subscribe[`status`].(type) {
				case int64:
					if subscribe[`status`].(int64) == 0 {
						w.WriteHeader(http.StatusOK)
						if err = json.NewEncoder(w).Encode(0); err != nil {
							log.Ctx().Error(err)
						}
						return
					}
				case int32:
					if subscribe[`status`].(int32) == 0 {
						w.WriteHeader(http.StatusOK)
						if err = json.NewEncoder(w).Encode(0); err != nil {
							log.Ctx().Error(err)
						}
					}
					return
				}
			}

			switch subscribe[`dateEnd`].(type) {
			case string:
				if mTime, err = time.Parse(`20060102`, subscribe[`dateEnd`].(string)); err != nil {
					log.Ctx().Debug(err)
					if mTime, err = time.Parse(`2006-01-02T15:04:05-07:00`, subscribe[`dateEnd`].(string)); err != nil {
						log.Ctx().Debug(err)
						if mTime, err = time.Parse(`2006-01-02T15:04:05Z`, subscribe[`dateEnd`].(string)); err != nil {
							log.Ctx().Debug(subscribe)
							log.Ctx().Error(err)
							w.WriteHeader(http.StatusBadRequest)
							return
						}
					}
				}
			case int64:
				mTime = time.Unix(subscribe[`dateEnd`].(int64), 0)
			}
			w.WriteHeader(http.StatusOK)
			if mTime.Unix() > time.Now().Unix() { // Не пришло время для перехода на free
				if subscribe[`status`] != nil {
					if err = json.NewEncoder(w).Encode(subscribe[`status`].(int64)); err != nil {
						log.Ctx().Error(err)
					}
				} else {
					if err = json.NewEncoder(w).Encode(2); err != nil {
						log.Ctx().Error(err)
					}
				}
			} else { // пришло время для перехода на free
				var (
					models []mongo.WriteModel
					opts   = options.BulkWrite().SetOrdered(false)
				)

				models = append(models, GetUpdateOneModel("subscribe.status", filter, int64(0)))

				if _, err = collection.BulkWrite(context.Background(), models, opts); err != nil {
					log.Ctx().Error(err)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
				if err = json.NewEncoder(w).Encode(0); err != nil {
					log.Ctx().Error(err)
				}
			}
			return
		case `info`:
			var (
				subscribe           = map[string]interface{}{}
				mTime               time.Time
				row                 = map[string]string{}
				answ                = map[string]interface{}{}
				resultPromo, result = map[string]interface{}{}, map[string]interface{}{}
			)

			if err = collectionPromo.FindOne(context.TODO(), filterPromo).Decode(&resultPromo); err != nil {
				if err != mongo.ErrNoDocuments {
					log.Ctx().Error(err)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
			}

			if err = collection.FindOne(context.TODO(), filter).Decode(&result); err != nil {
				if err == mongo.ErrNoDocuments {
					w.WriteHeader(http.StatusOK)

					if err = json.NewEncoder(w).Encode(answ); err != nil {
						log.Ctx().Error(err)
					}
					return
				}

				log.Ctx().Error(err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			// проверка interface conversion
			if _, ok := result[`subscribe`].(map[string]interface{}); !ok {
				log.Ctx().Debug(`it's error! interface is: `, result)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			subscribe = result[`subscribe`].(map[string]interface{})
			switch subscribe[`dateEnd`].(type) {
			case string:
				if mTime, err = time.Parse(`20060102`, subscribe[`dateEnd`].(string)); err != nil {
					log.Ctx().Debug(err)

					if mTime, err = time.Parse(`2006-01-02T15:04:05-07:00`, subscribe[`dateEnd`].(string)); err != nil {
						log.Ctx().Debug(err)

						if mTime, err = time.Parse(`2006-01-02T15:04:05Z`, subscribe[`dateEnd`].(string)); err != nil {
							log.Ctx().Debug(subscribe)
							log.Ctx().Error(err)
							w.WriteHeader(http.StatusBadRequest)
							return
						}
					}
				}
			case int64:
				mTime = time.Unix(subscribe[`dateEnd`].(int64), 0)
			}
			row[`%01`] = strconv.FormatInt(in.ID, baseInt)
			switch in.Locale {
			case ru:
				row[`%02`] = `Активна`
				row[`%04`] = `-`
				row[`%05`] = ``
			case en:
				row[`%02`] = `Activated`
				row[`%04`] = `-`
				row[`%05`] = ``
			}

			// проверка на наличие статуса (fix panic)
			status, ok := subscribe[`status`].(int64)
			if ok {
				switch status {
				case 0:
					row[`%06`] = `Free`
				case 1:
					row[`%06`] = `Light`
				case 2:
					row[`%06`] = `Pro`
				}
			}

			if resultPromo != nil {
				if d, ok := resultPromo[`name`].(string); ok {
					row[`%04`] = d
				}
			}

			if result[`demo_promo`] == `1` {
				switch in.Locale {
				case ru:
					row[`%05`] = `(пробный)`
				case en:
					row[`%05`] = `(trial)`
				}
			}
			if ok {
				switch status {
				case 0:
					row[`%03`] = `∞`
				default:
					row[`%03`] = mTime.Format(`02-01-2006`)
				}
			} else {
				row[`%03`] = mTime.Format(`02-01-2006`)
			}

			answ[`dateEnd`] = mTime
			answ[`text`] = formula.TemplateAccountInfo(in.Locale)
			for k, v := range row {
				answ[`text`] = strings.Replace(answ[`text`].(string), k, v, 1)
			}
			if err = json.NewEncoder(w).Encode(answ); err != nil {
				log.Ctx().Error(err)
			}
			return
		case all:
			var (
				opts  = options.Find().SetProjection(bson.M{"userName": 1})
				users []int64
			)
			if cursor, err = collection.Find(context.Background(), bson.M{}, opts); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				log.Ctx().Error(err)
				return
			}
			if err = cursor.All(context.Background(), &results); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				log.Ctx().Error(err)
				return
			}

			for _, v := range results {
				var u int64

				if u, err = strconv.ParseInt(v["userName"].(string), baseInt, bitSize); err != nil {
					log.Ctx().Error(err)
					continue
				}

				users = append(users, u)
			}

			w.WriteHeader(http.StatusOK)
			if err = json.NewEncoder(w).Encode(users); err != nil {
				log.Ctx().Error(err)
			}
			return
		case `contains`:
			if err = collection.FindOne(context.TODO(), filter).Decode(&result); err != nil {
				if err == mongo.ErrNoDocuments {
					w.WriteHeader(http.StatusOK)
					if err = json.NewEncoder(w).Encode(map[string]interface{}{
						"contains": false,
						`status`:   0,
					}); err != nil {
						log.Ctx().Error(err)
					}
					return
				}

				log.Ctx().Error(err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			w.WriteHeader(http.StatusOK)
			if err = json.NewEncoder(w).Encode(map[string]interface{}{
				"contains": true,
			}); err != nil {
				log.Ctx().Error(err)
			}
			return
		case `poll`:
			var (
				answ = map[string]interface{}{}
			)

			answ[`id`] = in.ID
			answ[`ok`] = true
			answ[`agreement`] = ``
			answ[`full_age`] = ``
			answ[`demo_promo`] = ``

			if err = collection.FindOne(context.TODO(), filter).Decode(&result); err != nil {
				if err == mongo.ErrNoDocuments {
					w.WriteHeader(http.StatusOK)

					answ["ok"] = false

					if err = json.NewEncoder(w).Encode(answ); err != nil {
						log.Ctx().Error(err)
					}
					return
				}

				log.Ctx().Error(err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			// Проверяем соглашение
			if result["agreement"] != nil && result["agreement"].(string) != "" && result["agreement"].(string) != "-99" {
				answ["agreement"] = result["agreement"]
			} else {
				answ["ok"] = false
			}
			// Проверяем возраст (Так как это требуется только в разделе оплат - возврат ok=false не делаем
			if result["fullage"] != nil && result["fullage"].(string) != "" && result["fullage"].(string) != "-99" {
				answ["full_age"] = result["fullage"]
			}
			// Проверяем использовал ли человек тестовый промокод?
			if result["demo_promo"] != nil && result["demo_promo"].(string) != "" && result["demo_promo"].(string) != "-99" {
				answ["demo_promo"] = result["demo_promo"]
			} else {
				answ["ok"] = false
			}

			w.WriteHeader(http.StatusOK)
			if err = json.NewEncoder(w).Encode(answ); err != nil {
				log.Ctx().Error(err)
			}
			return
		case `pay_stats`:
			var (
				startDate = time.Now().AddDate(0, 0, -int(in.CountDays))
				opts      = options.Find().SetSort(bson.M{`date`: -1})
				result    []struct {
					Amount  float64 `bson:"amount,omitempty"`
					Package string  `bson:"package,omitempty"`
				}
				answ                   = formula.TemplatePayStats()
				rowData                = map[string]string{}
				countL, countP, countU int64
				total                  float64
			)
			collection = src.Mongo.Database(`External`).Collection(`pay_orders`)
			filter = bson.M{`pay_service`: `paymaster`, `date`: bson.M{`$gt`: startDate}}
			if cursor, err = collection.Find(context.TODO(), filter, opts); err != nil {
				log.Ctx().Error(err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			if err = cursor.All(context.TODO(), &result); err != nil {
				log.Ctx().Error(err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			rowData[`%01`] = startDate.Format(`02-01-2006T15:04:05`)
			for _, v := range result {
				switch v.Package {
				case `light`:
					countL++
				case `pro`:
					countP++
				case `upgrade`:
					countU++
				}
				total += v.Amount
			}
			rowData[`%02`] = strconv.FormatInt(countL, 10)
			rowData[`%03`] = strconv.FormatInt(countP, 10)
			rowData[`%04`] = strconv.FormatInt(countU, 10)
			rowData[`%05`] = strconv.FormatFloat(total, 'f', 2, 64)
			for k, v := range rowData {
				answ = strings.Replace(answ, k, v, 1)
			}
			if err = json.NewEncoder(w).Encode(answ); err != nil {
				log.Ctx().Error(err)
			}
			return
		case `discount`:
			filterPromo = bson.M{
				`$and`: bson.A{
					bson.M{`users`: bson.M{`$in`: bson.A{in.ID}}},
					bson.M{`used`: bson.M{`$nin`: bson.A{in.ID}}},
					bson.M{`expression.discount`: bson.M{`$gt`: 0}},
				},
			}
			var (
				resultPromo []struct {
					Name       string    `bson:"name"`
					Status     int       `bson:"status"`
					Exeption   []string  `bson:"exeption,omitempty"`
					StartDate  time.Time `bson:"start_date"`
					EndDate    time.Time `bson:"end_date"`
					Expression struct {
						Discount int64 `bson:"discount,omitempty"`
						Days     int64 `bson:"days,omitempty"`
						Month    int64 `bson:"month,omitempty"`
					} `bson:"expression"`
					Users []int64 `bson:"users,omitempty"`
					Used  []int64 `bson:"used,omitempty"`
				}
				Discount int64
				Promo    string
				pipe     bson.A
			)
			pipe = bson.A{
				bson.D{
					{"$match",
						bson.D{
							{"users",
								bson.D{
									{"$in",
										bson.A{
											in.ID,
										},
									},
								},
							},
							{"used",
								bson.D{
									{"$nin",
										bson.A{
											in.ID,
										},
									},
								},
							},
							{"expression.discount", bson.D{{"$gt", 0}}},
						},
					},
				},
			}
			if cursor, err = collectionPromo.Aggregate(context.TODO(), pipe); err != nil {
				//if cursor, err = collectionPromo.Find(context.Background(), filter); err != nil {
				if err == mongo.ErrNoDocuments {
					if err = json.NewEncoder(w).Encode(map[string]interface{}{
						`name`:  ``,
						`value`: int64(0),
					}); err != nil {
						log.Ctx().Error(err)
					}
					return
				}
				w.WriteHeader(http.StatusBadRequest)
				log.Ctx().Error(err)
				return
			}
			if err = cursor.All(context.Background(), &resultPromo); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				log.Ctx().Error(err)
				return
			}
			// пока только первый из списка
			for _, promo := range resultPromo {
				Promo = promo.Name
				Discount = promo.Expression.Discount
				break
			}
			if err = json.NewEncoder(w).Encode(map[string]interface{}{
				`name`:  Promo,
				`value`: Discount,
			}); err != nil {
				log.Ctx().Error(err)
			}
			return
		}
	case `PUT`:
		var (
			models []mongo.WriteModel
			opts   = options.BulkWrite().SetOrdered(false)
		)

		models = append(models,
			GetUpdateOneModel("demo_promo", filter, "0"),
			GetUpdateOneModel("subscribe.dateStart", filter, in.Subscribe.DateStart),
			GetUpdateOneModel("subscribe.dateEnd", filter, in.Subscribe.DateEnd),
			GetUpdateOneModel("subscribe.status", filter, int64(0)),
			GetUpdateOneModel("locale", filter, in.Locale),
		)

		if _, err = collection.BulkWrite(context.Background(), models, opts); err != nil {
			log.Ctx().Error(err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusOK)
		return
	case `PURGE`:
		var (
			opts = options.Delete().SetCollation(&options.Collation{
				Locale:    `en_US`,
				Strength:  1,
				CaseLevel: false,
			})
			update   bson.M
			signals  = src.Mongo.Database(`External`).Collection(`signals`)
			metadata = src.Mongo.Database(`External`).Collection(`metadata`)
		)
		if _, err = collection.DeleteOne(context.TODO(), filter, opts); err != nil {
			log.Ctx().Error(err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		filter = bson.M{`users`: in.ID}
		update = bson.M{`$pull`: bson.M{`users`: in.ID}}
		if _, err = collectionPromo.UpdateOne(context.TODO(), filter, update); err != nil {
			log.Ctx().Error(err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		filter = bson.M{`user`: in.ID}
		if _, err = signals.DeleteOne(context.TODO(), filter, opts); err != nil {
			log.Ctx().Error(err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if _, err = metadata.DeleteMany(context.TODO(), filter, opts); err != nil {
			log.Ctx().Error(err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if err = src.PurgeMetrics(in.ID); err != nil {
			log.Ctx().Error(err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	default:
		log.Info(r.Method)
	}
}
