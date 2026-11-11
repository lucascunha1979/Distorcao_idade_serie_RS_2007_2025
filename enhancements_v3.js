
"use strict";


/* =========================================================================================
   TDI — V3
   CORREÇÃO DO MAPA + COMPARADORES
   ========================================================================================= */


/* =========================================================================================
   NORMALIZAÇÃO
   ========================================================================================= */

function normV3(value) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

}



function firstFieldV3(
    row,
    candidates
) {

    for (
        const field
        of
        candidates
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                row,
                field
            )
        ) {

            return row[field];

        }

    }


    return null;

}



function municipioCodeV3(row) {

    const value =
        firstFieldV3(
            row,
            [
                "MUNICIPIO_CODIGO",
                "CO_MUNICIPIO",
                "CD_MUN",
                "COD_MUNICIPIO"
            ]
        );


    if (
        value === null
        ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/\.0$/, "")
        .trim();

}



function locationV3(row) {

    return firstFieldV3(
        row,
        [
            "LOCALIZACAO",
            "LOCALIZACAO_HARMONIZADA",
            "LOCALIZACAO_FINAL",
            "TP_LOCALIZACAO"
        ]
    );

}



function dependencyV3(row) {

    return firstFieldV3(
        row,
        [
            "DEPENDENCIA",
            "DEPENDENCIA_HARMONIZADA",
            "DEPENDENCIA_FINAL",
            "DEPENDENCIA_ADMINISTRATIVA"
        ]
    );

}



function matchesLocationV3(
    row,
    value
) {

    return (
        normV3(
            locationV3(row)
        )
        ===
        normV3(value)
    );

}



function matchesDependencyV3(
    row,
    value
) {

    return (
        normV3(
            dependencyV3(row)
        )
        ===
        normV3(value)
    );

}



/* =========================================================================================
   ESCOPO CORRETO DAS METAS PPA
   ========================================================================================= */

function metaApplicableV3() {

    return (

        state.location === "Total"

        &&

        state.dependency === "Estadual"

        &&

        Number.isFinite(
            META_2027[
                state.indicator
            ]
        )

    );

}



function syncMetaAvailabilityV3() {

    const option =
        mapDom.mode.querySelector(
            'option[value="meta"]'
        );


    const allowed =
        metaApplicableV3();


    if (option) {

        option.disabled =
            !allowed;

    }


    if (
        state.mapMode === "meta"
        &&
        !allowed
    ) {

        state.mapMode =
            "taxa";


        mapDom.mode.value =
            "taxa";

    }

}



/* =========================================================================================
   DADOS DO ANO
   ========================================================================================= */

async function municipalRowsV3() {

    return await loadMunicipalYear(
        state.year
    );

}



/* =========================================================================================
   DADOS PARA O MAPA
   ========================================================================================= */

async function mapRowsV3() {

    const rows =
        await municipalRowsV3();


    let filtered =
        rows.filter(
            row =>
                matchesLocationV3(
                    row,
                    state.location
                )
                &&
                matchesDependencyV3(
                    row,
                    state.dependency
                )
        );


    /*
       Fallback para Total × Total.
    */

    if (
        filtered.length === 0
        &&
        state.location === "Total"
        &&
        state.dependency === "Total"
    ) {

        filtered =
            DATA.municipiosTotal
            .filter(
                row =>
                    Number(row.ANO)
                    ===
                    Number(state.year)
            );

    }


    return filtered;

}



/* =========================================================================================
   CORES
   ========================================================================================= */

function mapColorV3(value) {

    if (
        !isValue(value)
    ) {

        return MAP_NA_COLOR;

    }


    const numeric =
        Number(value);


    if (
        state.mapMode === "meta"
        &&
        metaApplicableV3()
    ) {

        const target =
            META_2027[
                state.indicator
            ];


        const delta =
            numeric - target;


        const group =
            MAP_TARGET_CLASSES.find(
                item =>
                    delta >= item.min
                    &&
                    delta < item.max
            );


        return (
            group?.color
            ||
            MAP_NA_COLOR
        );

    }


    const group =
        MAP_RATE_CLASSES.find(
            item =>
                numeric >= item.min
                &&
                numeric < item.max
        );


    return (
        group?.color
        ||
        MAP_NA_COLOR
    );

}



/* =========================================================================================
   LEGENDA
   ========================================================================================= */

function renderLegendV3() {

    let classes =
        MAP_RATE_CLASSES;


    let title =
        "Taxa de distorção idade-série";


    if (
        state.mapMode === "meta"
        &&
        metaApplicableV3()
    ) {

        const target =
            META_2027[
                state.indicator
            ];


        classes =
            MAP_TARGET_CLASSES;


        title =
            `Distância da meta PPA (${target.toFixed(1)}%)`;

    }


    mapDom.legend.innerHTML =
        `
        <div class="map-legend-title">
            ${title}
        </div>

        ${
            classes
            .map(
                item =>
                    `
                    <div class="legend-row">

                        <span
                            class="legend-color"
                            style="background:${item.color}"
                        ></span>

                        <span>
                            ${item.label}
                        </span>

                    </div>
                    `
            )
            .join("")
        }

        <div class="legend-row">

            <span
                class="legend-color"
                style="background:${MAP_NA_COLOR}"
            ></span>

            <span>
                Sem informação
            </span>

        </div>
        `;

}



/* =========================================================================================
   MAPA
   ========================================================================================= */

async function updateMapV3() {

    if (
        state.view !== "municipios"
    ) {

        return;

    }


    await ensureMapLoadedV2();


    syncMetaAvailabilityV3();


    const rows =
        await mapRowsV3();


    const values =
        new Map();


    let municipiosComValor =
        0;


    rows.forEach(
        row => {

            const code =
                municipioCodeV3(row);


            if (!code) {

                return;

            }


            const value =
                row[
                    state.indicator
                ];


            values.set(
                code,
                value
            );


            if (
                isValue(value)
            ) {

                municipiosComValor += 1;

            }

        }
    );


    const target =
        META_2027[
            state.indicator
        ];


    DATA.municipalLayer.eachLayer(
        layer => {

            const props =
                layer.feature.properties;


            const code =
                String(
                    props.MUNICIPIO_CODIGO
                );


            const name =
                props.MUNICIPIO_NOME;


            const value =
                values.has(code)
                ?
                values.get(code)
                :
                null;


            const selected =
                code
                ===
                String(
                    state.municipality
                );


            layer.setStyle(
                {

                    fillColor:
                        mapColorV3(
                            value
                        ),

                    fillOpacity:
                        0.85,

                    color:
                        selected
                        ?
                        "#123f50"
                        :
                        "#ffffff",

                    weight:
                        selected
                        ?
                        2.5
                        :
                        0.65,

                    opacity:
                        1

                }
            );


            let tooltip =
                `<strong>${escapeHTML(name)}</strong>`
                +
                `<br>Ano: ${state.year}`
                +
                `<br>${escapeHTML(selectedIndicatorName())}`
                +
                `<br>Taxa: <strong>${formatValue(value)}</strong>`;


            if (
                metaApplicableV3()
                &&
                isValue(value)
            ) {

                const delta =
                    Number(value)
                    -
                    target;


                tooltip +=
                    `<br>Meta PPA 2027: ${target.toFixed(1)}%`
                    +
                    `<br>Distância: `
                    +
                    `<strong>`
                    +
                    `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} p.p.`
                    +
                    `</strong>`;

            }


            tooltip +=
                `<br><span style="color:#6c7b82">`
                +
                `${escapeHTML(state.location)} • ${escapeHTML(state.dependency)}`
                +
                `</span>`;


            layer.unbindTooltip();


            layer.bindTooltip(
                tooltip,
                {
                    sticky:
                        true,

                    direction:
                        "top",

                    className:
                        "tdi-tooltip"
                }
            );

        }
    );


    renderLegendV3();


    mapDom.yearBadge.textContent =
        String(state.year);


    mapDom.yearOverlay.textContent =
        String(state.year);


    mapDom.indicatorBadge.textContent =
        selectedIndicatorName();


    mapDom.subtitle.textContent =
        `${state.location} • ${state.dependency}`;


    let status =
        `<strong>${municipiosComValor}</strong> municípios com valor `
        +
        `para o recorte selecionado.`;


    if (
        metaApplicableV3()
    ) {

        status +=
            ` Meta PPA 2027 da rede estadual: `
            +
            `<strong>${target.toFixed(1)}%</strong>.`;

    }
    else {

        status +=
            ` Para comparar com a meta PPA selecione `
            +
            `<strong>Total + Estadual</strong>.`;

    }


    mapDom.benchmarkNote.innerHTML =
        status;


    setTimeout(
        () => {

            DATA.map.invalidateSize();

        },
        30
    );

}



/* =========================================================================================
   SUBSTITUIR ROTINA CARTOGRÁFICA V2
   ========================================================================================= */

updateMunicipalMapV2 =
    updateMapV3;


syncMapModeAvailabilityV2 =
    syncMetaAvailabilityV3;



/* =========================================================================================
   PLOTLY — LAYOUT DOS COMPARADORES
   ========================================================================================= */

function comparisonLayoutV3() {

    return {

        margin: {
            l: 50,
            r: 15,
            t: 30,
            b: 82
        },

        paper_bgcolor:
            "#ffffff",

        plot_bgcolor:
            "#ffffff",

        font: {
            family:
                'Inter, "Segoe UI", Arial, sans-serif',

            color:
                "#35464f",

            size:
                11
        },

        xaxis: {
            automargin:
                true,

            tickangle:
                -20
        },

        yaxis: {
            title:
                "TDI (%)",

            rangemode:
                "tozero",

            gridcolor:
                "#e9eef1",

            zeroline:
                true,

            zerolinecolor:
                "#cbd5da"
        },

        legend: {
            orientation:
                "h",

            x:
                0,

            y:
                1.12
        },

        hovermode:
            "closest"
    };

}



/* =========================================================================================
   DADOS DO MUNICÍPIO SELECIONADO
   ========================================================================================= */

async function selectedMunicipalityRowsV3() {

    const rows =
        await municipalRowsV3();


    return rows.filter(
        row =>
            municipioCodeV3(row)
            ===
            String(
                state.municipality
            )
    );

}



function findCombinationV3(
    rows,
    location,
    dependency
) {

    return rows.find(
        row =>
            matchesLocationV3(
                row,
                location
            )
            &&
            matchesDependencyV3(
                row,
                dependency
            )
    );

}



/* =========================================================================================
   COMPARADOR — ETAPAS
   ========================================================================================= */

function renderStagesV3(rows) {

    const row =
        findCombinationV3(
            rows,
            state.location,
            state.dependency
        );


    const labels = [
        "Fundamental<br>Total",
        "Anos<br>Iniciais",
        "Anos<br>Finais",
        "Ensino<br>Médio"
    ];


    const indicators = [
        "TDI_FUN",
        "TDI_FUN_AI",
        "TDI_FUN_AF",
        "TDI_MED"
    ];


    const values =
        indicators.map(
            indicator => {

                const value =
                    row?.[indicator];


                return (
                    isValue(value)
                    ?
                    Number(value)
                    :
                    null
                );

            }
        );


    const traces = [

        {
            type:
                "bar",

            x:
                labels,

            y:
                values,

            name:
                "Taxa observada",

            text:
                values.map(
                    value =>
                        value === null
                        ?
                        "NA"
                        :
                        `${value.toFixed(1)}%`
                ),

            textposition:
                "outside",

            cliponaxis:
                false,

            hovertemplate:
                "%{x}<br>%{y:.1f}%<extra></extra>"
        }

    ];


    /*
       Metas PPA somente no recorte correto.
    */

    if (
        state.location === "Total"
        &&
        state.dependency === "Estadual"
    ) {

        traces.push(
            {
                type:
                    "scatter",

                mode:
                    "markers",

                x:
                    labels,

                y: [
                    null,
                    0,
                    10,
                    10
                ],

                name:
                    "Meta PPA 2027",

                marker: {
                    symbol:
                        "diamond",

                    size:
                        11
                },

                hovertemplate:
                    "Meta PPA 2027<br>%{y:.1f}%<extra></extra>"
            }
        );

    }


    Plotly.react(
        "chartCompareEtapas",
        traces,
        comparisonLayoutV3(),
        plotConfig()
    );

}



/* =========================================================================================
   COMPARADOR — LOCALIZAÇÃO
   ========================================================================================= */

function renderLocationV3(rows) {

    const categories = [
        "Total",
        "Urbana",
        "Rural"
    ];


    const values =
        categories.map(
            location => {

                const row =
                    findCombinationV3(
                        rows,
                        location,
                        state.dependency
                    );


                const value =
                    row?.[
                        state.indicator
                    ];


                return (
                    isValue(value)
                    ?
                    Number(value)
                    :
                    null
                );

            }
        );


    Plotly.react(
        "chartCompareLocalizacao",

        [
            {
                type:
                    "bar",

                x:
                    categories,

                y:
                    values,

                text:
                    values.map(
                        value =>
                            value === null
                            ?
                            "NA"
                            :
                            `${value.toFixed(1)}%`
                    ),

                textposition:
                    "outside",

                cliponaxis:
                    false,

                hovertemplate:
                    "%{x}<br>%{y:.1f}%<extra></extra>"
            }
        ],

        comparisonLayoutV3(),
        plotConfig()
    );

}



/* =========================================================================================
   COMPARADOR — DEPENDÊNCIA
   ========================================================================================= */

function renderDependencyV3(rows) {

    const categories = [
        "Total",
        "Pública",
        "Estadual",
        "Municipal",
        "Federal",
        "Privada"
    ];


    const values =
        categories.map(
            dependency => {

                const row =
                    findCombinationV3(
                        rows,
                        state.location,
                        dependency
                    );


                const value =
                    row?.[
                        state.indicator
                    ];


                return (
                    isValue(value)
                    ?
                    Number(value)
                    :
                    null
                );

            }
        );


    Plotly.react(
        "chartCompareDependencia",

        [
            {
                type:
                    "bar",

                x:
                    categories,

                y:
                    values,

                text:
                    values.map(
                        value =>
                            value === null
                            ?
                            "NA"
                            :
                            `${value.toFixed(1)}%`
                    ),

                textposition:
                    "outside",

                cliponaxis:
                    false,

                hovertemplate:
                    "%{x}<br>%{y:.1f}%<extra></extra>"
            }
        ],

        comparisonLayoutV3(),
        plotConfig()
    );

}



/* =========================================================================================
   ATUALIZAR COMPARADOR
   ========================================================================================= */

async function updateComparatorV3() {

    if (
        state.view !== "municipios"
    ) {

        return;

    }


    const rows =
        await selectedMunicipalityRowsV3();


    const metaMunicipio =
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


    const municipalityName =
        metaMunicipio?.MUNICIPIO_NOME
        ||
        state.municipality;


    document.getElementById(
        "comparisonContext"
    ).textContent =
        `${municipalityName} • ${state.year}`;


    renderStagesV3(rows);

    renderLocationV3(rows);

    renderDependencyV3(rows);


    const note =
        document.getElementById(
            "ppaComparisonNote"
        );


    if (
        state.location === "Total"
        &&
        state.dependency === "Estadual"
    ) {

        note.innerHTML =
            `Os marcadores do gráfico de etapas representam as metas `
            +
            `do <strong>PPA 2024–2027 do Rio Grande do Sul</strong> `
            +
            `para a <strong>rede pública estadual</strong>: `
            +
            `0% nos anos iniciais, 10% nos anos finais `
            +
            `e 10% no ensino médio.`;

    }
    else {

        note.innerHTML =
            `As metas do PPA referem-se à `
            +
            `<strong>rede pública estadual</strong>. `
            +
            `Selecione <strong>Localização = Total</strong> e `
            +
            `<strong>Dependência = Estadual</strong> `
            +
            `para visualizá-las no gráfico de etapas.`;

    }

}



/* =========================================================================================
   ACOPLAR COMPARADOR À ATUALIZAÇÃO MUNICIPAL
   ========================================================================================= */

const updateMunicipiosAntesV3 =
    updateMunicipios;


updateMunicipios =
    async function () {

        await updateMunicipiosAntesV3();


        if (
            state.view === "municipios"
        ) {

            await updateComparatorV3();

        }

    };



/* =========================================================================================
   SINCRONIZAR ESCOPO DAS METAS
   ========================================================================================= */

dom.location.addEventListener(
    "change",
    syncMetaAvailabilityV3
);


dom.dependency.addEventListener(
    "change",
    syncMetaAvailabilityV3
);


dom.indicator.addEventListener(
    "change",
    syncMetaAvailabilityV3
);


syncMetaAvailabilityV3();
