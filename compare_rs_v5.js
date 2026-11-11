
"use strict";


/* =========================================================================================
   TDI — V5
   COMPARAÇÃO MUNICÍPIO × RIO GRANDE DO SUL
   + CORREÇÃO DE ENQUADRAMENTO DO MAPA
   ========================================================================================= */


const comparisonStateV5 = {

    scope:
        "both"

};


const comparisonScopeSelectV5 =
    document.getElementById(
        "comparisonScopeSelect"
    );



/* =========================================================================================
   UTILIDADES
   ========================================================================================= */

function firstFieldV5(
    row,
    fields
) {

    for (
        const field
        of
        fields
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



function normalizeTextV5(
    value
) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    )
    .normalize(
        "NFD"
    )
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .trim()
    .toLowerCase();

}



function normalizeCodeV5(
    value
) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    )
    .replace(
        /\.0$/,
        ""
    )
    .trim();

}



function validNumberV5(
    value
) {

    return (

        value !== null

        &&

        value !== undefined

        &&

        value !== ""

        &&

        Number.isFinite(
            Number(
                value
            )
        )

    );

}



/* =========================================================================================
   IDENTIFICAR RIO GRANDE DO SUL
   ========================================================================================= */

function isRSV5(
    row
) {

    const sigla =
        firstFieldV5(
            row,
            [
                "UF_SIGLA",
                "SG_UF",
                "SIGLA_UF"
            ]
        );


    const codigo =
        firstFieldV5(
            row,
            [
                "UF_CODIGO",
                "CO_UF",
                "CD_UF",
                "COD_UF"
            ]
        );


    const nome =
        firstFieldV5(
            row,
            [
                "UF_NOME",
                "NO_UF",
                "NM_UF"
            ]
        );


    if (
        normalizeTextV5(
            sigla
        )
        ===
        "rs"
    ) {

        return true;

    }


    if (
        normalizeCodeV5(
            codigo
        )
        ===
        "43"
    ) {

        return true;

    }


    return (
        normalizeTextV5(
            nome
        )
        ===
        "rio grande do sul"
    );

}



/* =========================================================================================
   OBTER BASE DE ESTADOS
   ========================================================================================= */

function statesDataV5() {

    if (
        Array.isArray(
            DATA.estadosDetalhe
        )
    ) {

        return DATA.estadosDetalhe;

    }


    if (
        Array.isArray(
            DATA.estados
        )
    ) {

        return DATA.estados;

    }


    return [];

}



/* =========================================================================================
   LINHAS DO RS NO ANO
   ========================================================================================= */

function rsRowsV5() {

    return statesDataV5()
    .filter(
        row =>

            isRSV5(
                row
            )

            &&

            Number(
                row.ANO
            )
            ===
            Number(
                state.year
            )
    );

}



/* =========================================================================================
   LOCALIZAÇÃO / DEPENDÊNCIA
   ========================================================================================= */

function locationValueV5(
    row
) {

    return firstFieldV5(
        row,
        [
            "LOCALIZACAO",
            "LOCALIZACAO_HARMONIZADA",
            "LOCALIZACAO_FINAL"
        ]
    );

}



function dependencyValueV5(
    row
) {

    return firstFieldV5(
        row,
        [
            "DEPENDENCIA",
            "DEPENDENCIA_HARMONIZADA",
            "DEPENDENCIA_FINAL"
        ]
    );

}



function findCombinationV5(
    rows,
    location,
    dependency
) {

    return rows.find(
        row =>

            normalizeTextV5(
                locationValueV5(
                    row
                )
            )
            ===
            normalizeTextV5(
                location
            )

            &&

            normalizeTextV5(
                dependencyValueV5(
                    row
                )
            )
            ===
            normalizeTextV5(
                dependency
            )
    );

}



/* =========================================================================================
   MUNICÍPIO SELECIONADO
   ========================================================================================= */

async function municipalityRowsV5() {

    const rows =
        await loadMunicipalYear(
            state.year
        );


    return rows.filter(
        row =>
            normalizeCodeV5(
                row.MUNICIPIO_CODIGO
            )
            ===
            normalizeCodeV5(
                state.municipality
            )
    );

}



/* =========================================================================================
   NOME DO MUNICÍPIO
   ========================================================================================= */

function municipalityNameV5() {

    const municipality =
        DATA.dimMunicipios?.find(
            row =>
                normalizeCodeV5(
                    row.MUNICIPIO_CODIGO
                )
                ===
                normalizeCodeV5(
                    state.municipality
                )
        );


    if (
        municipality?.MUNICIPIO_NOME
    ) {

        return municipality.MUNICIPIO_NOME;

    }


    const option =
        dom.municipality?.selectedOptions?.[0];


    if (
        option
    ) {

        return option.textContent.trim();

    }


    return "Município";

}



/* =========================================================================================
   CONFIGURAÇÃO PLOTLY
   ========================================================================================= */

function plotConfigV5() {

    if (
        typeof plotConfig
        ===
        "function"
    ) {

        return plotConfig();

    }


    return {

        responsive:
            true,

        displaylogo:
            false

    };

}



/* =========================================================================================
   LAYOUT COMPARATIVO
   ========================================================================================= */

function comparisonLayoutV5() {

    return {

        barmode:
            "group",

        bargap:
            0.22,

        bargroupgap:
            0.08,

        margin: {

            l:
                50,

            r:
                15,

            t:
                40,

            b:
                85

        },

        paper_bgcolor:
            "#ffffff",

        plot_bgcolor:
            "#ffffff",

        font: {

            family:
                'Inter, "Segoe UI", Arial, sans-serif',

            size:
                11,

            color:
                "#34464f"

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
                "#e7edef",

            zeroline:
                true,

            zerolinecolor:
                "#cad4d8"

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
   TRAÇO
   ========================================================================================= */

function barTraceV5(
    name,
    labels,
    values
) {

    return {

        type:
            "bar",

        name:
            name,

        x:
            labels,

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
            `${name}<br>%{x}<br>%{y:.1f}%<extra></extra>`

    };

}



/* =========================================================================================
   ESCOLHER ABRANGÊNCIA
   ========================================================================================= */

function tracesByScopeV5(
    municipalityTrace,
    rsTrace
) {

    if (
        comparisonStateV5.scope
        ===
        "municipio"
    ) {

        return [
            municipalityTrace
        ];

    }


    if (
        comparisonStateV5.scope
        ===
        "rs"
    ) {

        return [
            rsTrace
        ];

    }


    return [

        municipalityTrace,
        rsTrace

    ];

}



/* =========================================================================================
   ETAPAS
   ========================================================================================= */

function renderStagesV5(
    municipalityRows,
    rsRows
) {

    const labels = [

        "Fundamental<br>Total",
        "Anos<br>Iniciais",
        "Anos<br>Finais",
        "Ensino<br>Médio"

    ];


    const fields = [

        "TDI_FUN",
        "TDI_FUN_AI",
        "TDI_FUN_AF",
        "TDI_MED"

    ];


    const municipalRow =
        findCombinationV5(
            municipalityRows,
            state.location,
            state.dependency
        );


    const rsRow =
        findCombinationV5(
            rsRows,
            state.location,
            state.dependency
        );


    const municipalityValues =
        fields.map(
            field => {

                const value =
                    municipalRow?.[
                        field
                    ];


                return (
                    validNumberV5(
                        value
                    )
                    ?
                    Number(
                        value
                    )
                    :
                    null
                );

            }
        );


    const rsValues =
        fields.map(
            field => {

                const value =
                    rsRow?.[
                        field
                    ];


                return (
                    validNumberV5(
                        value
                    )
                    ?
                    Number(
                        value
                    )
                    :
                    null
                );

            }
        );


    const municipalityName =
        municipalityNameV5();


    const traces =
        tracesByScopeV5(

            barTraceV5(
                municipalityName,
                labels,
                municipalityValues
            ),

            barTraceV5(
                "Rio Grande do Sul",
                labels,
                rsValues
            )

        );


    /*
       Metas PPA:
       somente Total + Estadual.
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

                name:
                    "Meta PPA 2027",

                x:
                    labels,

                y: [

                    null,
                    0,
                    10,
                    10

                ],

                marker: {

                    symbol:
                        "diamond",

                    size:
                        12

                },

                hovertemplate:
                    "Meta PPA 2027<br>%{y:.1f}%<extra></extra>"

            }
        );

    }


    Plotly.react(

        "chartCompareEtapas",

        traces,

        comparisonLayoutV5(),

        plotConfigV5()

    );

}



/* =========================================================================================
   LOCALIZAÇÃO
   ========================================================================================= */

function renderLocationsV5(
    municipalityRows,
    rsRows
) {

    const categories = [

        "Total",
        "Urbana",
        "Rural"

    ];


    const municipalityValues =
        categories.map(
            category => {

                const row =
                    findCombinationV5(
                        municipalityRows,
                        category,
                        state.dependency
                    );


                const value =
                    row?.[
                        state.indicator
                    ];


                return (
                    validNumberV5(
                        value
                    )
                    ?
                    Number(
                        value
                    )
                    :
                    null
                );

            }
        );


    const rsValues =
        categories.map(
            category => {

                const row =
                    findCombinationV5(
                        rsRows,
                        category,
                        state.dependency
                    );


                const value =
                    row?.[
                        state.indicator
                    ];


                return (
                    validNumberV5(
                        value
                    )
                    ?
                    Number(
                        value
                    )
                    :
                    null
                );

            }
        );


    Plotly.react(

        "chartCompareLocalizacao",

        tracesByScopeV5(

            barTraceV5(
                municipalityNameV5(),
                categories,
                municipalityValues
            ),

            barTraceV5(
                "Rio Grande do Sul",
                categories,
                rsValues
            )

        ),

        comparisonLayoutV5(),

        plotConfigV5()

    );

}



/* =========================================================================================
   DEPENDÊNCIA ADMINISTRATIVA
   ========================================================================================= */

function renderDependenciesV5(
    municipalityRows,
    rsRows
) {

    const categories = [

        "Total",
        "Pública",
        "Estadual",
        "Municipal",
        "Federal",
        "Privada"

    ];


    const municipalityValues =
        categories.map(
            category => {

                const row =
                    findCombinationV5(
                        municipalityRows,
                        state.location,
                        category
                    );


                const value =
                    row?.[
                        state.indicator
                    ];


                return (
                    validNumberV5(
                        value
                    )
                    ?
                    Number(
                        value
                    )
                    :
                    null
                );

            }
        );


    const rsValues =
        categories.map(
            category => {

                const row =
                    findCombinationV5(
                        rsRows,
                        state.location,
                        category
                    );


                const value =
                    row?.[
                        state.indicator
                    ];


                return (
                    validNumberV5(
                        value
                    )
                    ?
                    Number(
                        value
                    )
                    :
                    null
                );

            }
        );


    Plotly.react(

        "chartCompareDependencia",

        tracesByScopeV5(

            barTraceV5(
                municipalityNameV5(),
                categories,
                municipalityValues
            ),

            barTraceV5(
                "Rio Grande do Sul",
                categories,
                rsValues
            )

        ),

        comparisonLayoutV5(),

        plotConfigV5()

    );

}



/* =========================================================================================
   ATUALIZAR OS TRÊS COMPARADORES
   ========================================================================================= */

async function updateComparatorsV5() {

    if (
        state.view !== "municipios"
    ) {

        return;

    }


    const municipalityRows =
        await municipalityRowsV5();


    const rsRows =
        rsRowsV5();


    const municipalityName =
        municipalityNameV5();


    const context =
        document.getElementById(
            "comparisonContext"
        );


    let scopeText =
        `${municipalityName} × Rio Grande do Sul`;


    if (
        comparisonStateV5.scope
        ===
        "municipio"
    ) {

        scopeText =
            municipalityName;

    }


    if (
        comparisonStateV5.scope
        ===
        "rs"
    ) {

        scopeText =
            "Rio Grande do Sul";

    }


    context.textContent =
        `${scopeText} • ${state.year}`;


    renderStagesV5(
        municipalityRows,
        rsRows
    );


    renderLocationsV5(
        municipalityRows,
        rsRows
    );


    renderDependenciesV5(
        municipalityRows,
        rsRows
    );


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
            `A série <strong>Rio Grande do Sul</strong> corresponde `
            +
            `à taxa oficial da UF publicada pelo Inep, `
            +
            `<strong>não à média dos municípios</strong>. `
            +
            `Os diamantes representam as metas do PPA 2024–2027 `
            +
            `para a rede pública estadual.`;

    }
    else {

        note.innerHTML =
            `A série <strong>Rio Grande do Sul</strong> corresponde `
            +
            `à taxa oficial da UF publicada pelo Inep, `
            +
            `<strong>não à média dos 497 municípios</strong>. `
            +
            `Para visualizar as metas do PPA, selecione `
            +
            `<strong>Localização = Total</strong> e `
            +
            `<strong>Dependência = Estadual</strong>.`;

    }

}



/* =========================================================================================
   ACOPLAR AO updateMunicipios EXISTENTE
   ========================================================================================= */

const updateMunicipiosAntesV5 =
    updateMunicipios;


updateMunicipios =
    async function () {

        await updateMunicipiosAntesV5();


        if (
            state.view === "municipios"
        ) {

            await updateComparatorsV5();

        }

    };



/* =========================================================================================
   SELETOR DE ABRANGÊNCIA
   ========================================================================================= */

comparisonScopeSelectV5.addEventListener(

    "change",

    async () => {

        comparisonStateV5.scope =
            comparisonScopeSelectV5.value;


        await updateComparatorsV5();

    }

);



/* =========================================================================================
   CORREÇÃO DO ENQUADRAMENTO DO MAPA
   ========================================================================================= */

function getLeafletMapV5() {

    /*
       Arquitetura V3.
    */

    if (
        DATA
        &&
        DATA.map
    ) {

        return DATA.map;

    }


    /*
       Arquitetura V4, caso ela exista.
    */

    if (
        typeof mapStateV4 !== "undefined"
        &&
        mapStateV4.map
    ) {

        return mapStateV4.map;

    }


    return null;

}



function getLeafletLayerV5() {

    if (
        DATA
        &&
        DATA.municipalLayer
    ) {

        return DATA.municipalLayer;

    }


    if (
        typeof mapStateV4 !== "undefined"
        &&
        mapStateV4.layer
    ) {

        return mapStateV4.layer;

    }


    return null;

}



function refitMapV5() {

    const map =
        getLeafletMapV5();


    const layer =
        getLeafletLayerV5();


    if (
        !map
        ||
        !layer
    ) {

        return;

    }


    map.invalidateSize(
        true
    );


    const bounds =
        layer.getBounds();


    if (
        bounds
        &&
        bounds.isValid()
    ) {

        map.fitBounds(

            bounds,

            {

                padding: [
                    12,
                    12
                ],

                animate:
                    false

            }

        );

    }

}



/* =========================================================================================
   WRAP setView
   ========================================================================================= */

const setViewAntesV5 =
    setView;


setView =
    function (
        view
    ) {

        setViewAntesV5(
            view
        );


        if (
            view === "municipios"
        ) {

            setTimeout(
                refitMapV5,
                150
            );


            setTimeout(
                refitMapV5,
                500
            );


            setTimeout(
                refitMapV5,
                1000
            );

        }

    };



/* =========================================================================================
   RESIZE OBSERVER
   ========================================================================================= */

const mapElementV5 =
    document.getElementById(
        "mapMunicipios"
    );


if (
    mapElementV5
    &&
    typeof ResizeObserver !== "undefined"
) {

    const observerV5 =
        new ResizeObserver(
            () => {

                if (
                    state.view === "municipios"
                ) {

                    setTimeout(
                        refitMapV5,
                        30
                    );

                }

            }
        );


    observerV5.observe(
        mapElementV5
    );

}



/* =========================================================================================
   WINDOW RESIZE
   ========================================================================================= */

window.addEventListener(

    "resize",

    () => {

        if (
            state.view === "municipios"
        ) {

            setTimeout(
                refitMapV5,
                80
            );

        }

    }

);
