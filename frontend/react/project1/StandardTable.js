import React, { useEffect, useRef, useState } from "react";
import _ from "lodash";

import { DataTable } from "ui-8.0/datatable";
import { Column } from "ui-8.0/column";
import { MultiSelect } from "ui-8.0/multiselect";
import { Button } from "ui-8.0/button";
import { InputText } from 'ui-8.0/inputtext';
import { InputNumber } from 'ui-8.0/inputnumber';
import { InputSwitch } from "ui-8.0/inputswitch";
import { Dropdown } from 'ui-8.0/dropdown';
import { Checkbox } from 'ui-8.0/checkbox';
import { Skeleton } from "ui-8.0/skeleton";
import { Dialog } from 'ui-8.0/dialog';
import { Rating } from "ui-8.0/rating";
import { Toast } from "ui-8.0/toast";
import { TriStateCheckbox } from 'ui-8.0/tristatecheckbox';

import { ColumnHeader } from './components/ColumnHeader';
import { generalTemplates } from "./components/columnTemplates";
import { formatDate } from "../helpers/utils";

export const StandardTable = ({ tableData, setTableData, updateData, loading, error, setLazyRange, tableFilters, setTableFilters, clearFilters, infiniteScrollMode, setInfiniteScrollMode, providedTemplates = {}, columnTotals, totalRecords, queryParams, setQueryParams, editable, tableColumns, selectionsOptions, modal, onHideModal }) => {

    const dataTableRef = useRef(null);
    const virtualScrollerRef = useRef(null);
    const toast = useRef(null);

    const [lazyLoading, setLazyLoading] = useState(true);
    const [selectedColumns, setSelectedColumns] = useState(tableColumns);

    useEffect(() => {
        if (tableData && !loading) {
            // Если данные пришли и лоадинг родительского обработчика выключился, завершаем лоадинг таблицы
            setLazyLoading(false);
        }
    }, [tableData, loading]);

    useEffect(() => {
        if (error) {
            // Выводим сообщение об ошибке
            toast.current.show({
                severity: "error",
                summary: "Сервер ответил ошибкой",
                detail: `Не удалось получить данные для таблицы. Ошибка ${error.status}. Повторите позже.`,
                life: 10000
            });
        }
    }, [error]);

    // МЕТОДЫ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -- - - - - - - - - - - -

    // Метод обновления данных при бесконечном скролле
    const onLazyLoad = event => {
        if (lazyLoading) return;
        let { first, last } = event; // Получаем индексы смещения для бесконечного скролла
        if (last > 0) {
            setLazyLoading(true);
            setLazyRange({ first, last }); // Обновляем рейндж для корректной вставки полученных данных в фейковый массив в родительском методе
            updateData({ rows: last - first, first: first }, infiniteScrollMode, { first, last }); // Просим родителя обновить данные
        }
    };

    // Пагинация
    const onPage = event => {
        const { first, rows } = event; // Получаем индексы для запроса данных
        setLazyLoading(true);
        updateData({ rows, first }, infiniteScrollMode); // Просим родителя обновить данные
        dataTableRef.current.resetScroll(); // Возвращаем скролл
    };

    // Фильтр
    const onFilter = event => {
        dataTableRef.current.resetScroll();
        setTableFilters(event.filters);
    };

    // Сортировка
    const onSort = event => {
        dataTableRef.current.resetScroll();
        // Получаем поле и порядок, отдаем родителю для обновления данных 
        setQueryParams(prev => ({ ...prev, sortOrder: event.sortOrder > 0 ? "asc" : "desc", sortField: event.sortField }));
    };

    // Включение/выключение колонок
    const onColumnToggle = event => {
        const _сolumns = event.value; // Получаем список выбранных колонок из мультиселекта
        const _initColumns = tableColumns.map(col => ({ ...col }));

        const orderedColumns = _initColumns.filter(iCol => {
            if (_сolumns.filter(col => col.code === iCol.code).length > 0) return iCol // Сравниваем с изначальным массивом
        })

        orderedColumns.map(col => {
            return selectedColumns.map(sCol =>
                col.code === sCol.code
            );
        });
        setSelectedColumns(orderedColumns); // Обновляем список включенных для отображения колонок
    };

    // Обновляем данные при завершении редактирования ячейки
    const onRowEditComplete = (e) => {
        let _data = [...tableData]; // Копируем данные
        let { newData, index } = e;
        const offset = infiniteScrollMode ? 0 : queryParams.first; // При бесконечном скролле получаем индекс смещения
        _data[index - offset] = newData; // Обновляем строку
        setTableData(_data);
    };

    // Меняем тип таблицы с бесконечного скролла на пагинацию и обратно
    const changeScrollMode = bool => {
        dataTableRef.current.resetScroll(); // Возвращаем скролл
        if (virtualScrollerRef.current) {
            virtualScrollerRef.current.scrollInView({
                index: 0,
                to: "to-start",
                behavior: "auto"
            })
        }
        setLazyLoading(true);
        updateData({ rows: bool ? 69 : 50, first: 0 }, bool, { first: 0, last: 69 }); // Делаем стандартный запрос
        setLazyRange({ first: 0, last: 69 });
        setInfiniteScrollMode(bool);
    };

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -- - - - - - - - - - - - МЕТОДЫ


    // ШАБЛОНЫ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -- - - - - - - - - - - -

    // Шаблон шапки таблицы
    const tableHeaderTemplate = (
        <div className="flex justify-content-between flex-wrap">
            <div className="flex">
                <div className="m-2">
                    <label htmlFor="columnToggler" className="block mb-2">
                        Колонки
                    </label>
                    <MultiSelect // Здесь список колонок для отображения
                        id="columnToggler"
                        name="columnToggler"
                        value={selectedColumns.map(col => ({
                            code: col.code,
                            displayName: col.displayName
                        }))}
                        options={tableColumns.map(col => ({
                            code: col.code,
                            displayName: col.displayName
                        }))}
                        optionLabel="displayName"
                        className="mr-5"
                        onChange={onColumnToggle}
                        style={{ width: "20em" }}
                    />
                </div>
            </div>

            <div className="flex flex-column justify-content-end">
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Очистить"
                    className="p-button-outlined m-2"
                    onClick={clearFilters} // Очищаем все фильтры
                />
            </div>
        </div>
    );

    // Шаблон пагинатора
    const paginatorTemplate = {
        // Набор элементов в пагинаторе
        layout:
            "CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown",
        RowsPerPageDropdown: options => {
            // Опции количества строк для вывода за раз
            const dropdownOptions = [
                { label: 25, value: 25 },
                { label: 50, value: 50 },
                { label: 100, value: 100 }
            ];

            return (
                <div className="flex align-items-center no-wrap">
                    <span
                        className="mx-1"
                        style={{
                            color: "var(--text-color)",
                            userSelect: "none"
                        }}
                    >
                        Выводить по:{" "}
                    </span>
                    <Dropdown
                        value={queryParams.rows}
                        options={dropdownOptions}
                        onChange={options.onChange}
                    />
                </div>
            );
        },
        CurrentPageReport: options => {
            return (
                <span
                    style={{
                        color: "var(--text-color)",
                        userSelect: "none",
                        minWidth: "120px",
                        textAlign: "center"
                    }}
                >
                    С {options.first} по {options.last} из {totalRecords}
                </span>
            );
        }
    };

    // Шаблон шапки колонки
    const columnHeaderTemplate = (code, colIndex, displayName, editable, dataType, selectionSource) => {
        return <ColumnHeader code={code} displayName={displayName} editable={editable} options={selectionsOptions?.[selectionSource]?.[code]} dataType={dataType} infiniteScrollMode={infiniteScrollMode} columnTotals={columnTotals} colIndex={colIndex} />
    }

    // Шаблон ячейки
    const columnBodyTemplate = (rowData, code, dataType, selectionSource) => {

        if (!rowData || lazyLoading) // Если данных нет или идет подгрузка, отдаем заглушку
            return (
                <Skeleton
                    className="my-1"
                    width={`${50}%`}
                    height={`${1}rem`}
                />
            );

        if (generalTemplates[code]) {
            return generalTemplates[code](rowData, code) // Проверяем, есть ли общий шаблон для такого типа колонок
        }

        if (providedTemplates[code]) {
            return providedTemplates[code](rowData); // Проверяем, есть ли кастомный шаблон, предоставленный родителем
        }

        // Далее идем по типам данных колонок, при совпадении форматируем содержимое

        if (dataType === "multiSelection") {
            if (rowData[code]) {
                const ids = rowData[code].split(",");
                const names = ids.map(id => {
                    return selectionsOptions[selectionSource][code].filter(option => option.id == id)[0].name
                })
                return <>{names.join(", ")}</>;
            }
        }

        if (dataType === "boolean") {
            return <span className="w-full text-center">
                {!!rowData[code] &&
                    <i
                        className="pi pi-check-circle"
                        style={{
                            color: 'var(--green-500)',
                            fontSize: '1.75rem'
                        }}>
                    </i>
                }
            </span>;
        }

        if (dataType === "date") {
            return <span >{formatDate(rowData[code])}</span>;
        }

        if (dataType === "rating") {
            return <div className="flex justify-content-center w-full">
                <Rating value={rowData[code]} readOnly cancel={false} />
            </div>;
        }

        // Если никаких конфигов не нашлось, просто выводим содержимое без форматирования

        return <>{rowData[code]}</>
    }

    // Шаблон футера колонки
    const columnFooterTemplate = (colName, colIndex) => {
        if (!columnTotals || infiniteScrollMode) return null; // Если в таблице не предусмотрены "Итого" или включен бесконечный скролл, не рендерим ничего
        if (colIndex === 0) {
            return <span>Итого:</span>;
        } else {
            return <span>{columnTotals[colName]}</span>;
        }
    };

    // Шаблон редактируемой ячейки
    const cellEditor = (options) => {

        // Только для редактируемых таблиц
        // Ищем нужный тип редактора в зависимости от типа данных в ячейке
        const editorTypes = {
            number: priceEditor(options),
            boolean: booleanEditor(options),
            selection: selectionEditor(options, selectionSource),
            multiSelection: multiSelectionEditor(options, selectionSource),
        }

        if (editorTypes[options.column.props.dataType]) {
            return editorTypes[options.column.props.dataType](options, options.column.props.selectionSource)
        } else return textEditor(options);
    };

    const textEditor = (options) => {
        return <InputText type="text" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} className="w-full" />;
    };

    const priceEditor = (options) => {
        return <InputNumber value={options.value} onValueChange={(e) => options.editorCallback(e.value)} className="w-full" />;
    };

    const booleanEditor = (options) => {
        const bool = options.value;
        return <span className="w-full text-center">
            <Checkbox onChange={() => options.editorCallback(!bool)} checked={options.value} />
        </span>;
    };

    const selectionEditor = (options, selectionSource) => {
        return <Dropdown value={options.value} onChange={(e) => options.editorCallback(e.value)} options={selectionsOptions[selectionSource][options.field]} optionLabel="name" className="w-full" emptyMessage="Список пуст" />;
    };

    const multiSelectionEditor = (options, selectionSource) => {
        const getValue = () => {
            if (options.value) {
                // Айдишники приходят от сервера в виде строки через запятую, разбиваем их и создаем массив
                const ids = options.value.split(",");
                const arr = ids.map(id => {
                    return selectionsOptions[selectionSource][options.field].filter(option => option.id == id)[0]
                })
                return arr;
            } else return [];
        }
        const getString = (value) => {
            // Собираем названия, соответствующие айдишникам и склеиваем в строчку
            return value.map(obj => obj.id).join(",")
        }
        return <MultiSelect value={getValue()} onChange={(e) => options.editorCallback(getString(e.value))} options={selectionsOptions[selectionSource][options.field]} optionLabel="name" className="w-full" />;
    };

    // Шаблон фильтра из шапки колонки
    const getFilterElement = (options, dataType, displayName) => {

        // Сначала ищем, нет ли шаблонов для указанного типа
        const filterTypes = {
            boolean: booleanFilterTemplate(options, displayName),
            rating: ratingFilterTemplate(options),
        }
        if (filterTypes[dataType]) {
            return filterTypes[dataType](options, displayName)
        } else return defaultFilterTemplate(options); // Если не нашлось прописанных шаблонов, отдаем стандартный
    }

    const booleanFilterTemplate = (options, colName) => {
        // Используем чекбокс с возможностью проставлять null
        return <div className="flex align-items-center gap-2 w-15rem">
            <label htmlFor={options.field + "_filter"} className="font-bold">
                {colName}
            </label>
            <TriStateCheckbox inputId={options.field + "_filter"} value={options.value} onChange={(e) => options.filterCallback(e.value)} />
        </div>;
    };

    const ratingFilterTemplate = (options) => {
        return <div className="flex justify-content-center w-15rem mt-2">
            <Rating value={options.value} onChange={(e) => options.filterCallback(e.value, options.index)} />
        </div>;
    };

    const defaultFilterTemplate = (options) => {
        return <InputText value={options.value} onChange={(e) => options.filterCallback(e.target.value, options.index)} />;
    };

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -- - - - - - - - - - - - ШАБЛОНЫ


    // Возвращаем компонент таблицы
    return (
        <div className="card">
            <Toast ref={toast} position="top-left" />
            <DataTable
                ref={dataTableRef}
                value={tableData} // Начинка таблицы, массив строк для вывода
                lazy
                loading={loading || lazyLoading} // При родительском или собственном лоадинге таблица должна блокировать взаимодействие, пока не отрендерятся строки
                virtualScrollerOptions={infiniteScrollMode ? {
                    lazy: true,
                    ref: virtualScrollerRef,
                    onLazyLoad: onLazyLoad,
                    itemSize: 70,
                    delay: 100,
                    numToleratedItems: 20,
                    step: 10
                } : null} // Если включен режим бесконечного скролла, прописываем конфиг, иначе передаем null, чтобы отключить виртуальный скроллер
                editMode="row"
                onRowEditComplete={onRowEditComplete} // При редактируемой таблице подключаем метод сохранения редактирования
                header={tableHeaderTemplate} // Подключаем шаблон шапки
                resizableColumns // Включен режим ресайза колонок
                columnResizeMode="fit"
                className={`p-datatable-gridlines p-datatable-lazy ${infiniteScrollMode ? "infinite-scrolling" : ""}`}
                scrollable
                scrollHeight="57vh" // Оптимальная высота, хардкодится для возможности бесконечного скролла
                emptyMessage="Нет данных для отображения" // Если массив строк пустой
                paginator={!infiniteScrollMode}
                paginatorTemplate={paginatorTemplate}
                onSort={onSort}
                removableSort
                sortField={queryParams.sortField}
                sortOrder={
                    queryParams.sortOrder === "asc"
                        ? 1
                        : queryParams.sortOrder === "desc"
                            ? -1
                            : queryParams.sortOrder
                }
                onPage={onPage}
                onFilter={onFilter}
                filters={tableFilters}
                first={queryParams.first}
                rows={queryParams.rows}
                totalRecords={totalRecords} // Общее количество записей, получаем от сервера, чтобы строить пагинацию и бесконечный скролл
                footer={<InfiniteScrollSwitch infiniteScrollMode={infiniteScrollMode} changeScrollMode={changeScrollMode} />}
            >
                {selectedColumns.map((col, index) => { // Проходимся по массиву выбранных колонок и рендерим только включенные
                    return <Column
                        key={col.code}
                        dataType={col.type}
                        field={col.code}
                        header={columnHeaderTemplate(
                            col.code,
                            index,
                            col.displayName,
                            (editable && col.editable),
                            col.type,
                            col.selectionSource
                        )}
                        body={rowData =>
                            columnBodyTemplate(rowData, col.code, col.type, col.selectionSource)
                        }
                        footer={columnFooterTemplate(col.code, index)}
                        selectionSource={col.selectionSource}
                        filter={col.filterable}
                        filterElement={(options) => getFilterElement(options, col.type, col.displayName)}
                        sortable={col.sortable}
                        showFilterMatchModes={false}
                        showFilterOperator={false}
                        showAddButton={true}
                        maxConstraints={5}
                        resizeable={col.code !== "photo" && col.code !== "index"} // Колонки с фото и порядковым числом не ресайзим
                        editor={(options) => editable && col.editable ? cellEditor(options) : getBodyTemplate(options.rowData, col.code, col.type)} // Если включен режим редактирования и колонка редактируемая, выводим редактор, а иначе просто содержимое ячейки
                        style={{
                            minWidth: col.width || col.minWidth || "6rem",
                            width: col.width || col.minWidth || "10rem",
                            maxWidth: col.width || "none"
                        }}
                    />
                })}
                {editable &&
                    <Column
                        rowEditor
                        frozen
                        resizeable={false}
                        alignFrozen="right"
                        style={{ width: '7rem' }}
                        bodyStyle={{ display: "flex", justifyContent: 'center' }}
                    />
                }
            </DataTable>
            <Dialog header={modal.header} footer={modal.footer} visible={modal.visible} style={{ width: modal.width }} onHide={onHideModal}>
                {modal.content}
            </Dialog>
        </div>
    )
}

const InfiniteScrollSwitch = ({ infiniteScrollMode, changeScrollMode }) => {
    return (
        <div
            className="flex align-items-center justify-content-center mt-3 mb-2"
            style={{ flexBasis: "100%" }}
        >
            <InputSwitch
                checked={!infiniteScrollMode}
                onChange={() => changeScrollMode(!infiniteScrollMode)}
            />
            <span
                className={`ml-3 text-${!infiniteScrollMode ? "primary" : "400"
                    } font-normal`}
            >
                Постраничный вывод
            </span>
        </div>
    );
};