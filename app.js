
"use strict";


/* =========================================================================================
   CONFIGURAÇÃO
   ========================================================================================= */

const PATHS = {

    manifest:
        "./manifest.json",

    brasilDetalhe:
        "./dados/brasil_detalhe.json",

    estadosDetalhe:
        "./dados/estados_detalhe.json",

    estadosTotal:
        "./dados/estados_total_total.json",

    municipiosTotal:
        "./dados/municipios_total_total.json",

    dimUfs:
        "./dados/dim_ufs.json",

    dimMunicipios:
        "./dados/dim_municipios_rs.json",

    escolasIndex:
        "./dados/escolas_index.json"

};


const INDICATOR_NAMES = {

    TDI_FUN:
        "Ensino Fundamental — Total",

    TDI_FUN_AI:
        "Ensino Fundamental — Anos Iniciais",

    TDI_FUN_AF:
        "Ensino Fundamental — Anos Finais",

    TDI_MED:
        "Ensino Médio — Total"

};


const state = {

    view:
        "estados",

    year:
        2025,

    indicator:
        "TDI_FUN",

    location:
        "Total",

    dependency:
        "Total",

    uf:
        "RS",

    municipality:
        "4314902",

    school:
        null

};


const DATA = {

    manifest:
        null,

    brasilDetalhe:
        [],

    estadosDetalhe:
        [],

    estadosTotal:
        [],

    municipiosTotal:
        [],

    dimUfs:
        [],

    dimMunicipios:
        [],

    escolasIndex:
        [],

    municipiosAnoCache:
        new Map(),

    escolasMunicipioCache:
        new Map()

};



/* =========================================================================================
   DOM
   ========================================================================================= */

const dom = {

    loading:
        document.getElementById("loadingScreen"),

    year:
        document.getElementById("yearSelect"),

    indicator:
        document.getElementById("indicatorSelect"),

    location:
        document.getElementById("locationSelect"),

    dependency:
        document.getElementById("dependencySelect"),

    uf:
        document.getElementById("ufSelect"),

    municipality:
        document.getElementById("municipalitySelect"),

    school:
        document.getElementById("schoolSelect"),

    ufBox:
        document.getElementById("ufFilterBox"),

    municipalityBox:
        document.getElementById("municipalityFilterBox")

};



/* =========================================================================================
   UTILIDADES
   ========================================================================================= */

async function loadJSON(path) {

    const response = await fetch(
        path,
        {
            cache:
                "no-store"
        }
    );


    if (!response.ok) {

        throw new Error(
            `Falha ao carregar ${path}: HTTP ${response.status}`
        );

    }


    return response.json();

}



function isValue(value) {

    return (
        value !== null
        &&
        value !== undefined
        &&
        Number.isFinite(
            Number(value)
        )
    );

}



function formatValue(value) {

    if (!isValue(value)) {

        return "NA";

    }


    return `${Number(value).toFixed(1)}%`;

}



function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}



function selectedIndicatorName() {

    return (
        INDICATOR_NAMES[
            state.indicator
        ]
        ||
        state.indicator
    );

}



function exactFilter(record) {

    return (
        Number(
            record.ANO
        )
        ===
        Number(
            state.year
        )
        &&
        record.LOCALIZACAO
        ===
        state.location
        &&
        record.DEPENDENCIA
        ===
        state.dependency
    );

}



function schoolCategoryFilter(record) {

    const locationOK = (
        state.location === "Total"
        ||
        record.LOCALIZACAO === state.location
    );


    let dependencyOK = false;


    if (
        state.dependency === "Total"
    ) {

        dependencyOK = true;

    }
    else if (
        state.dependency === "Pública"
    ) {

        dependencyOK = [
            "Federal",
            "Estadual",
            "Municipal"
        ].includes(
            record.DEPENDENCIA
        );

    }
    else {

        dependencyOK = (
            record.DEPENDENCIA
            ===
            state.dependency
        );

    }


    return (
        locationOK
        &&
        dependencyOK
    );

}



function plotConfig() {

    return {

        responsive:
            true,

        displaylogo:
            false,

        modeBarButtonsToRemove: [

            "lasso2d",
            "select2d",
            "autoScale2d"

        ]

    };

}



function basePlotLayout() {

    return {

        margin: {
            l: 58,
            r: 25,
            t: 30,
            b: 55
        },

        paper_bgcolor:
            "#ffffff",

        plot_bgcolor:
            "#ffffff",

        font: {

            family:
                'Inter, "Segoe UI", Arial, sans-serif',

            color:
                "#33434c",

            size:
                12
        },

        xaxis: {

            fixedrange:
                false,

            gridcolor:
                "#edf1f3",

            zeroline:
                false

        },

        yaxis: {

            title:
                "TDI (%)",

            gridcolor:
                "#edf1f3",

            rangemode:
                "tozero",

            zeroline:
                false

        },

        hovermode:
            "x unified",

        legend: {

            orientation:
                "h",

            y:
                1.08,

            x:
                0

        }

    };

}



/* =========================================================================================
   CARREGAMENTO SOB DEMANDA
   ========================================================================================= */

async function loadMunicipalYear(year) {

    const key = String(
        year
    );


    if (
        DATA.municipiosAnoCache.has(
            key
        )
    ) {

        return DATA.municipiosAnoCache.get(
            key
        );

    }


    const data = await loadJSON(
        `./dados/municipios/${key}.json`
    );


    DATA.municipiosAnoCache.set(
        key,
        data
    );


    return data;

}



async function loadMunicipalitySchools(code) {

    const key = String(
        code
    );


    if (
        DATA.escolasMunicipioCache.has(
            key
        )
    ) {

        return DATA.escolasMunicipioCache.get(
            key
        );

    }


    const data = await loadJSON(
        `./dados/escolas/${key}.json`
    );


    DATA.escolasMunicipioCache.set(
        key,
        data
    );


    return data;

}



/* =========================================================================================
   CONTROLES
   ========================================================================================= */

function populateControls() {

    dom.year.innerHTML =
        DATA.manifest.periodo.anos
        .slice()
        .reverse()
        .map(
            year =>
                `<option value="${year}">
                    ${year}
                </option>`
        )
        .join("");


    dom.year.value =
        String(
            state.year
        );


    dom.uf.innerHTML =
        DATA.dimUfs
        .slice()
        .sort(
            (a, b) =>
                String(
                    a.UF_NOME
                )
                .localeCompare(
                    String(
                        b.UF_NOME
                    ),
                    "pt-BR"
                )
        )
        .map(
            row =>
                `<option value="${escapeHTML(row.UF_SIGLA)}">
                    ${escapeHTML(row.UF_NOME)}
                </option>`
        )
        .join("");


    dom.uf.value =
        state.uf;


    dom.municipality.innerHTML =
        DATA.dimMunicipios
        .slice()
        .sort(
            (a, b) =>
                String(
                    a.MUNICIPIO_NOME
                )
                .localeCompare(
                    String(
                        b.MUNICIPIO_NOME
                    ),
                    "pt-BR"
                )
        )
        .map(
            row =>
                `<option value="${escapeHTML(row.MUNICIPIO_CODIGO)}">
                    ${escapeHTML(row.MUNICIPIO_NOME)}
                </option>`
        )
        .join("");


    if (
        !DATA.dimMunicipios.some(
            row =>
                String(
                    row.MUNICIPIO_CODIGO
                )
                ===
                String(
                    state.municipality
                )
        )
    ) {

        state.municipality =
            String(
                DATA.dimMunicipios[0]
                .MUNICIPIO_CODIGO
            );

    }


    dom.municipality.value =
        state.municipality;

}



/* =========================================================================================
   ABAS
   ========================================================================================= */

function setView(view) {

    state.view =
        view;


    document
    .querySelectorAll(
        ".tab-button"
    )
    .forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.view === view
            );

        }
    );


    document
    .querySelectorAll(
        ".view"
    )
    .forEach(
        section => {

            section.classList.remove(
                "active"
            );

        }
    );


    document
    .getElementById(
        `view-${view}`
    )
    .classList.add(
        "active"
    );


    dom.ufBox.classList.toggle(
        "hidden",
        view !== "estados"
    );


    dom.municipalityBox.classList.toggle(
        "hidden",
        view === "estados"
    );


    updateCurrentView();

}



/* =========================================================================================
   EVENTOS
   ========================================================================================= */

function bindEvents() {

    document
    .querySelectorAll(
        ".tab-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    setView(
                        button.dataset.view
                    );

                }
            );

        }
    );


    dom.year.addEventListener(
        "change",
        () => {

            state.year =
                Number(
                    dom.year.value
                );

            updateCurrentView();

        }
    );


    dom.indicator.addEventListener(
        "change",
        () => {

            state.indicator =
                dom.indicator.value;

            updateCurrentView();

        }
    );


    dom.location.addEventListener(
        "change",
        () => {

            state.location =
                dom.location.value;

            updateCurrentView();

        }
    );


    dom.dependency.addEventListener(
        "change",
        () => {

            state.dependency =
                dom.dependency.value;

            updateCurrentView();

        }
    );


    dom.uf.addEventListener(
        "change",
        () => {

            state.uf =
                dom.uf.value;

            updateEstados();

        }
    );


    dom.municipality.addEventListener(
        "change",
        async () => {

            state.municipality =
                String(
                    dom.municipality.value
                );

            state.school =
                null;


            if (
                state.view === "municipios"
            ) {

                await updateMunicipios();

            }
            else if (
                state.view === "escolas"
            ) {

                await updateEscolas();

            }

        }
    );


    dom.school.addEventListener(
        "change",
        () => {

            state.school =
                String(
                    dom.school.value
                );

            updateEscolas();

        }
    );

}



/* =========================================================================================
   RANKING HTML
   ========================================================================================= */

function renderRanking(
    targetId,
    rows,
    {
        nameKey,
        valueKey,
        codeKey,
        selectedCode,
        clickCallback
    }
) {

    const target = document.getElementById(
        targetId
    );


    if (
        !rows.length
    ) {

        target.innerHTML =
            `<div class="empty-ranking">
                Nenhum valor disponível para o recorte selecionado.
            </div>`;

        return;

    }


    target.innerHTML =
        rows
        .map(
            (row, index) => {

                const code =
                    String(
                        row[
                            codeKey
                        ]
                    );


                const selected =
                    String(
                        selectedCode
                    )
                    ===
                    code;


                return `
                    <div
                        class="rank-row ${selected ? "selected" : ""}"
                        data-code="${escapeHTML(code)}"
                    >

                        <div class="rank-position">
                            ${index + 1}
                        </div>

                        <div
                            class="rank-name"
                            title="${escapeHTML(row[nameKey])}"
                        >
                            ${escapeHTML(row[nameKey])}
                        </div>

                        <div class="rank-value">
                            ${formatValue(row[valueKey])}
                        </div>

                    </div>
                `;

            }
        )
        .join("");


    if (
        clickCallback
    ) {

        target
        .querySelectorAll(
            ".rank-row"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        clickCallback(
                            element.dataset.code
                        );

                    }
                );

            }
        );

    }

}



/* =========================================================================================
   BRASIL E ESTADOS
   ========================================================================================= */

function updateEstados() {

    const indicator =
        state.indicator;


    const brazilRecord =
        DATA.brasilDetalhe.find(
            row =>
                exactFilter(
                    row
                )
        );


    const statesFiltered =
        DATA.estadosDetalhe
        .filter(
            row =>
                exactFilter(
                    row
                )
        );


    const selectedState =
        statesFiltered.find(
            row =>
                row.UF_SIGLA
                ===
                state.uf
        );


    const ranking =
        statesFiltered
        .filter(
            row =>
                isValue(
                    row[
                        indicator
                    ]
                )
        )
        .slice()
        .sort(
            (a, b) =>
                Number(
                    a[
                        indicator
                    ]
                )
                -
                Number(
                    b[
                        indicator
                    ]
                )
        );


    const rankIndex =
        ranking.findIndex(
            row =>
                row.UF_SIGLA
                ===
                state.uf
        );


    const ufName =
        DATA.dimUfs.find(
            row =>
                row.UF_SIGLA
                ===
                state.uf
        )?.UF_NOME
        ||
        state.uf;


    document.getElementById(
        "kpiBrasil"
    ).textContent =
        formatValue(
            brazilRecord?.[
                indicator
            ]
        );


    document.getElementById(
        "kpiUf"
    ).textContent =
        formatValue(
            selectedState?.[
                indicator
            ]
        );


    document.getElementById(
        "kpiUfLabel"
    ).textContent =
        ufName;


    document.getElementById(
        "kpiRankUf"
    ).textContent =
        rankIndex >= 0
        ?
        `${rankIndex + 1}º`
        :
        "NA";


    document.getElementById(
        "kpiUfDisponiveis"
    ).textContent =
        ranking.length;


    document.getElementById(
        "overviewContext"
    ).textContent =
        `${state.year} • ${selectedIndicatorName()} • ${state.location} • ${state.dependency}`;


    renderRanking(

        "rankingEstados",

        ranking,

        {

            nameKey:
                "UF_NOME",

            valueKey:
                indicator,

            codeKey:
                "UF_SIGLA",

            selectedCode:
                state.uf,

            clickCallback:
                code => {

                    state.uf =
                        code;

                    dom.uf.value =
                        code;

                    updateEstados();

                }

        }

    );


    const years =
        DATA.manifest.periodo.anos;


    const brazilSeries =
        years.map(
            year => {

                const row =
                    DATA.brasilDetalhe.find(
                        record =>
                            Number(
                                record.ANO
                            )
                            ===
                            Number(
                                year
                            )
                            &&
                            record.LOCALIZACAO
                            ===
                            state.location
                            &&
                            record.DEPENDENCIA
                            ===
                            state.dependency
                    );


                return (
                    row
                    &&
                    isValue(
                        row[
                            indicator
                        ]
                    )
                )
                ?
                Number(
                    row[
                        indicator
                    ]
                )
                :
                null;

            }
        );


    const ufSeries =
        years.map(
            year => {

                const row =
                    DATA.estadosDetalhe.find(
                        record =>
                            Number(
                                record.ANO
                            )
                            ===
                            Number(
                                year
                            )
                            &&
                            record.UF_SIGLA
                            ===
                            state.uf
                            &&
                            record.LOCALIZACAO
                            ===
                            state.location
                            &&
                            record.DEPENDENCIA
                            ===
                            state.dependency
                    );


                return (
                    row
                    &&
                    isValue(
                        row[
                            indicator
                        ]
                    )
                )
                ?
                Number(
                    row[
                        indicator
                    ]
                )
                :
                null;

            }
        );


    Plotly.react(

        "chartEstadosSerie",

        [

            {

                x:
                    years,

                y:
                    brazilSeries,

                type:
                    "scatter",

                mode:
                    "lines+markers",

                name:
                    "Brasil",

                line: {
                    width: 2.5
                },

                marker: {
                    size: 6
                }

            },

            {

                x:
                    years,

                y:
                    ufSeries,

                type:
                    "scatter",

                mode:
                    "lines+markers",

                name:
                    ufName,

                line: {
                    width: 3
                },

                marker: {
                    size: 6
                }

            }

        ],

        basePlotLayout(),

        plotConfig()

    );

}



/* =========================================================================================
   MUNICÍPIOS
   ========================================================================================= */

async function updateMunicipios() {

    const indicator =
        state.indicator;


    const dataYear =
        await loadMunicipalYear(
            state.year
        );


    const filtered =
        dataYear
        .filter(
            row =>
                row.LOCALIZACAO
                ===
                state.location
                &&
                row.DEPENDENCIA
                ===
                state.dependency
        );


    const ranking =
        filtered
        .filter(
            row =>
                isValue(
                    row[
                        indicator
                    ]
                )
        )
        .slice()
        .sort(
            (a, b) =>
                Number(
                    a[
                        indicator
                    ]
                )
                -
                Number(
                    b[
                        indicator
                    ]
                )
        );


    const selectedRow =
        filtered.find(
            row =>
                String(
                    row.MUNICIPIO_CODIGO
                )
                ===
                String(
                    state.municipality
                )
        );


    const municipalityMeta =
        DATA.dimMunicipios.find(
            row =>
                String(
                    row.MUNICIPIO_CODIGO
                )
                ===
                String(
                    state.municipality
                )
        );


    const rsRecord =
        DATA.estadosDetalhe.find(
            row =>
                Number(
                    row.ANO
                )
                ===
                Number(
                    state.year
                )
                &&
                row.UF_SIGLA
                ===
                "RS"
                &&
                row.LOCALIZACAO
                ===
                state.location
                &&
                row.DEPENDENCIA
                ===
                state.dependency
        );


    const municipalitiesWithRecord =
        new Set(
            filtered.map(
                row =>
                    String(
                        row.MUNICIPIO_CODIGO
                    )
            )
        );


    document.getElementById(
        "kpiMunicipio"
    ).textContent =
        formatValue(
            selectedRow?.[
                indicator
            ]
        );


    document.getElementById(
        "kpiMunicipioNome"
    ).textContent =
        municipalityMeta?.MUNICIPIO_NOME
        ||
        "—";


    document.getElementById(
        "kpiRsMunicipal"
    ).textContent =
        formatValue(
            rsRecord?.[
                indicator
            ]
        );


    document.getElementById(
        "kpiMunicipiosDisponiveis"
    ).textContent =
        ranking.length;


    document.getElementById(
        "kpiMunicipiosSemValor"
    ).textContent =
        Math.max(
            0,
            497
            -
            ranking.length
        );


    document.getElementById(
        "municipalContext"
    ).textContent =
        `${state.year} • ${selectedIndicatorName()} • ${state.location} • ${state.dependency}`;


    renderRanking(

        "rankingMunicipios",

        ranking,

        {

            nameKey:
                "MUNICIPIO_NOME",

            valueKey:
                indicator,

            codeKey:
                "MUNICIPIO_CODIGO",

            selectedCode:
                state.municipality,

            clickCallback:
                code => {

                    state.municipality =
                        code;

                    dom.municipality.value =
                        code;

                    updateMunicipios();

                }

        }

    );


    /*
        A série municipal usa a base Total × Total,
        evitando carregar os 19 arquivos detalhados simultaneamente.
    */

    const seriesRows =
        DATA.municipiosTotal
        .filter(
            row =>
                String(
                    row.MUNICIPIO_CODIGO
                )
                ===
                String(
                    state.municipality
                )
        )
        .sort(
            (a, b) =>
                Number(
                    a.ANO
                )
                -
                Number(
                    b.ANO
                )
        );


    Plotly.react(

        "chartMunicipioSerie",

        [

            {

                x:
                    seriesRows.map(
                        row =>
                            row.ANO
                    ),

                y:
                    seriesRows.map(
                        row =>
                            isValue(
                                row[
                                    indicator
                                ]
                            )
                            ?
                            Number(
                                row[
                                    indicator
                                ]
                            )
                            :
                            null
                    ),

                type:
                    "scatter",

                mode:
                    "lines+markers",

                name:
                    municipalityMeta?.MUNICIPIO_NOME
                    ||
                    "Município",

                connectgaps:
                    false,

                line: {
                    width: 3
                },

                marker: {
                    size: 6
                }

            }

        ],

        basePlotLayout(),

        plotConfig()

    );

}



/* =========================================================================================
   ESCOLAS
   ========================================================================================= */

async function updateSchoolSelector(
    schoolsData
) {

    const schoolMap =
        new Map();


    schoolsData.forEach(
        row => {

            const code =
                String(
                    row.ESCOLA_CODIGO
                );


            if (
                !schoolMap.has(
                    code
                )
            ) {

                schoolMap.set(
                    code,
                    row.ESCOLA_NOME
                );

            }

        }
    );


    const schools =
        Array
        .from(
            schoolMap.entries()
        )
        .map(
            ([code, name]) => ({
                code,
                name
            })
        )
        .sort(
            (a, b) =>
                String(
                    a.name
                )
                .localeCompare(
                    String(
                        b.name
                    ),
                    "pt-BR"
                )
        );


    if (
        !schools.length
    ) {

        dom.school.innerHTML =
            `<option value="">
                Nenhuma escola
            </option>`;

        state.school =
            null;

        return;

    }


    if (
        !state.school
        ||
        !schoolMap.has(
            String(
                state.school
            )
        )
    ) {

        state.school =
            schools[0].code;

    }


    dom.school.innerHTML =
        schools
        .map(
            school =>
                `<option value="${escapeHTML(school.code)}">
                    ${escapeHTML(school.name)}
                </option>`
        )
        .join("");


    dom.school.value =
        state.school;

}



async function updateEscolas() {

    const indicator =
        state.indicator;


    const schoolsData =
        await loadMunicipalitySchools(
            state.municipality
        );


    await updateSchoolSelector(
        schoolsData
    );


    const municipalityMeta =
        DATA.dimMunicipios.find(
            row =>
                String(
                    row.MUNICIPIO_CODIGO
                )
                ===
                String(
                    state.municipality
                )
        );


    const yearData =
        schoolsData.filter(
            row =>
                Number(
                    row.ANO
                )
                ===
                Number(
                    state.year
                )
        );


    const filtered =
        yearData
        .filter(
            row =>
                schoolCategoryFilter(
                    row
                )
                &&
                isValue(
                    row[
                        indicator
                    ]
                )
        );


    const ranking =
        filtered
        .slice()
        .sort(
            (a, b) =>
                Number(
                    a[
                        indicator
                    ]
                )
                -
                Number(
                    b[
                        indicator
                    ]
                )
        );


    const selectedRecord =
        filtered.find(
            row =>
                String(
                    row.ESCOLA_CODIGO
                )
                ===
                String(
                    state.school
                )
        );


    const selectedSchoolAnyYear =
        schoolsData.find(
            row =>
                String(
                    row.ESCOLA_CODIGO
                )
                ===
                String(
                    state.school
                )
        );


    const municipalityTotal =
        DATA.municipiosTotal.find(
            row =>
                Number(
                    row.ANO
                )
                ===
                Number(
                    state.year
                )
                &&
                String(
                    row.MUNICIPIO_CODIGO
                )
                ===
                String(
                    state.municipality
                )
        );


    document.getElementById(
        "kpiEscola"
    ).textContent =
        formatValue(
            selectedRecord?.[
                indicator
            ]
        );


    document.getElementById(
        "kpiEscolaNome"
    ).textContent =
        selectedSchoolAnyYear?.ESCOLA_NOME
        ||
        "—";


    document.getElementById(
        "kpiEscolasDisponiveis"
    ).textContent =
        ranking.length;


    document.getElementById(
        "kpiEscolasArquivo"
    ).textContent =
        new Set(
            yearData.map(
                row =>
                    String(
                        row.ESCOLA_CODIGO
                    )
            )
        ).size;


    document.getElementById(
        "kpiMunicipioEscola"
    ).textContent =
        formatValue(
            municipalityTotal?.[
                indicator
            ]
        );


    document.getElementById(
        "schoolContext"
    ).textContent =
        `${municipalityMeta?.MUNICIPIO_NOME || ""} • ${state.year} • ${selectedIndicatorName()}`;


    renderRanking(

        "rankingEscolas",

        ranking,

        {

            nameKey:
                "ESCOLA_NOME",

            valueKey:
                indicator,

            codeKey:
                "ESCOLA_CODIGO",

            selectedCode:
                state.school,

            clickCallback:
                code => {

                    state.school =
                        code;

                    dom.school.value =
                        code;

                    updateEscolas();

                }

        }

    );


    const seriesRows =
        schoolsData
        .filter(
            row =>
                String(
                    row.ESCOLA_CODIGO
                )
                ===
                String(
                    state.school
                )
        )
        .sort(
            (a, b) =>
                Number(
                    a.ANO
                )
                -
                Number(
                    b.ANO
                )
        );


    Plotly.react(

        "chartEscolaSerie",

        [

            {

                x:
                    seriesRows.map(
                        row =>
                            row.ANO
                    ),

                y:
                    seriesRows.map(
                        row =>
                            isValue(
                                row[
                                    indicator
                                ]
                            )
                            ?
                            Number(
                                row[
                                    indicator
                                ]
                            )
                            :
                            null
                    ),

                type:
                    "scatter",

                mode:
                    "lines+markers",

                name:
                    selectedSchoolAnyYear?.ESCOLA_NOME
                    ||
                    "Escola",

                connectgaps:
                    false,

                line: {
                    width: 3
                },

                marker: {
                    size: 6
                }

            }

        ],

        basePlotLayout(),

        plotConfig()

    );

}



/* =========================================================================================
   ATUALIZAÇÃO DA VIEW ATUAL
   ========================================================================================= */

async function updateCurrentView() {

    try {

        if (
            state.view === "estados"
        ) {

            updateEstados();

        }
        else if (
            state.view === "municipios"
        ) {

            await updateMunicipios();

        }
        else if (
            state.view === "escolas"
        ) {

            await updateEscolas();

        }

    }
    catch (
        error
    ) {

        console.error(
            error
        );


        alert(
            `Erro ao atualizar painel:\n${error.message}`
        );

    }

}



/* =========================================================================================
   INICIALIZAÇÃO
   ========================================================================================= */

async function init() {

    try {

        [

            DATA.manifest,

            DATA.brasilDetalhe,

            DATA.estadosDetalhe,

            DATA.estadosTotal,

            DATA.municipiosTotal,

            DATA.dimUfs,

            DATA.dimMunicipios,

            DATA.escolasIndex

        ] = await Promise.all([

            loadJSON(
                PATHS.manifest
            ),

            loadJSON(
                PATHS.brasilDetalhe
            ),

            loadJSON(
                PATHS.estadosDetalhe
            ),

            loadJSON(
                PATHS.estadosTotal
            ),

            loadJSON(
                PATHS.municipiosTotal
            ),

            loadJSON(
                PATHS.dimUfs
            ),

            loadJSON(
                PATHS.dimMunicipios
            ),

            loadJSON(
                PATHS.escolasIndex
            )

        ]);


        populateControls();

        bindEvents();

        updateEstados();


        dom.loading.classList.add(
            "hidden"
        );

    }
    catch (
        error
    ) {

        console.error(
            error
        );


        document.querySelector(
            ".loading-box"
        ).innerHTML =
            `
            <strong>
                Não foi possível iniciar o painel
            </strong>

            <span>
                ${escapeHTML(error.message)}
            </span>
            `;

    }

}


document.addEventListener(
    "DOMContentLoaded",
    init
);
