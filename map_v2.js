
"use strict";


/* =========================================================================================
   TDI — PAINEL V2
   MÓDULO CARTOGRÁFICO / METAS / ANIMAÇÃO
   ========================================================================================= */


/* =========================================================================================
   METAS DE REFERÊNCIA PARA 2027
   ========================================================================================= */

const META_2027 = {

    TDI_FUN:
        null,

    TDI_FUN_AI:
        0,

    TDI_FUN_AF:
        10,

    TDI_MED:
        10

};



/* =========================================================================================
   CLASSES FIXAS — TAXA OBSERVADA
   Mantemos as mesmas classes em todos os anos para permitir comparação temporal real.
   ========================================================================================= */

const MAP_RATE_CLASSES = [

    {
        min: -Infinity,
        max: 5,
        color: "#fff7bc",
        label: "até 5%"
    },

    {
        min: 5,
        max: 10,
        color: "#fee391",
        label: "5% a 10%"
    },

    {
        min: 10,
        max: 15,
        color: "#fec44f",
        label: "10% a 15%"
    },

    {
        min: 15,
        max: 20,
        color: "#fe9929",
        label: "15% a 20%"
    },

    {
        min: 20,
        max: 30,
        color: "#ec7014",
        label: "20% a 30%"
    },

    {
        min: 30,
        max: 40,
        color: "#cc4c02",
        label: "30% a 40%"
    },

    {
        min: 40,
        max: Infinity,
        color: "#8c2d04",
        label: "40% ou mais"
    }

];



/* =========================================================================================
   CLASSES — DISTÂNCIA AO PATAMAR DA META
   valor = taxa municipal - meta 2027
   ========================================================================================= */

const MAP_TARGET_CLASSES = [

    {
        min: -Infinity,
        max: 0.0000001,
        color: "#238443",
        label: "meta atingida"
    },

    {
        min: 0.0000001,
        max: 5,
        color: "#d9f0a3",
        label: "até 5 p.p. acima"
    },

    {
        min: 5,
        max: 10,
        color: "#fee08b",
        label: "5 a 10 p.p. acima"
    },

    {
        min: 10,
        max: 20,
        color: "#fc8d59",
        label: "10 a 20 p.p. acima"
    },

    {
        min: 20,
        max: Infinity,
        color: "#d73027",
        label: "mais de 20 p.p. acima"
    }

];


const MAP_NA_COLOR =
    "#d8dde0";



/* =========================================================================================
   ESTADO ADICIONAL
   ========================================================================================= */

state.mapMode =
    "taxa";


state.animationSpeed =
    1000;



DATA.municipalGeoJSON =
    null;


DATA.map =
    null;


DATA.municipalLayer =
    null;


DATA.mapInitialized =
    false;



let animationTimer =
    null;



/* =========================================================================================
   DOM DO MAPA
   ========================================================================================= */

const mapDom = {

    mode:
        document.getElementById(
            "mapModeSelect"
        ),

    previous:
        document.getElementById(
            "previousYearButton"
        ),

    play:
        document.getElementById(
            "playMapButton"
        ),

    next:
        document.getElementById(
            "nextYearButton"
        ),

    speed:
        document.getElementById(
            "animationSpeedSelect"
        ),

    benchmarkNote:
        document.getElementById(
            "mapBenchmarkNote"
        ),

    yearBadge:
        document.getElementById(
            "mapYearBadge"
        ),

    yearOverlay:
        document.getElementById(
            "mapYearOverlay"
        ),

    indicatorBadge:
        document.getElementById(
            "mapIndicatorBadge"
        ),

    subtitle:
        document.getElementById(
            "mapSubtitle"
        ),

    legend:
        document.getElementById(
            "mapLegend"
        ),

    methodologyButton:
        document.getElementById(
            "methodologyButton"
        ),

    methodologyModal:
        document.getElementById(
            "methodologyModal"
        ),

    methodologyClose:
        document.getElementById(
            "methodologyCloseButton"
        )

};



/* =========================================================================================
   META
   ========================================================================================= */

function getTarget2027() {

    return META_2027[
        state.indicator
    ];

}



/* =========================================================================================
   DISPONIBILIDADE DO MODO META
   ========================================================================================= */

function syncMapModeAvailabilityV2() {

    const target =
        getTarget2027();


    const option =
        mapDom.mode.querySelector(
            'option[value="meta"]'
        );


    if (
        option
    ) {

        option.disabled =
            !Number.isFinite(
                target
            );

    }


    if (
        state.mapMode === "meta"
        &&
        !Number.isFinite(
            target
        )
    ) {

        state.mapMode =
            "taxa";


        mapDom.mode.value =
            "taxa";

    }


    updateBenchmarkNoteV2();

}



/* =========================================================================================
   NOTA DA META
   ========================================================================================= */

function updateBenchmarkNoteV2() {

    const target =
        getTarget2027();


    if (
        state.mapMode === "meta"
        &&
        Number.isFinite(
            target
        )
    ) {

        mapDom.benchmarkNote.innerHTML =
            `Patamar estadual de referência para 2027: `
            +
            `<strong>${target.toFixed(1)}%</strong>. `
            +
            `O mapa representa taxa municipal − meta, em pontos percentuais.`;

        return;

    }


    if (
        Number.isFinite(
            target
        )
    ) {

        mapDom.benchmarkNote.innerHTML =
            `Meta estadual de referência para 2027: `
            +
            `<strong>${target.toFixed(1)}%</strong>.`;

        return;

    }


    mapDom.benchmarkNote.innerHTML =
        `Não há meta 2027 informada para `
        +
        `<strong>${escapeHTML(selectedIndicatorName())}</strong>.`;

}



/* =========================================================================================
   CLASSIFICAÇÃO
   ========================================================================================= */

function mapClassForValueV2(
    value,
    classes
) {

    if (
        !isValue(
            value
        )
    ) {

        return null;

    }


    const numeric =
        Number(
            value
        );


    return (
        classes.find(
            item =>
                numeric >= item.min
                &&
                numeric < item.max
        )
        ||
        null
    );

}



/* =========================================================================================
   COR
   ========================================================================================= */

function mapColorV2(
    rate
) {

    if (
        !isValue(
            rate
        )
    ) {

        return MAP_NA_COLOR;

    }


    if (
        state.mapMode === "meta"
    ) {

        const target =
            getTarget2027();


        if (
            !Number.isFinite(
                target
            )
        ) {

            return MAP_NA_COLOR;

        }


        const delta =
            Number(
                rate
            )
            -
            target;


        return (
            mapClassForValueV2(
                delta,
                MAP_TARGET_CLASSES
            )?.color
            ||
            MAP_NA_COLOR
        );

    }


    return (
        mapClassForValueV2(
            Number(
                rate
            ),
            MAP_RATE_CLASSES
        )?.color
        ||
        MAP_NA_COLOR
    );

}



/* =========================================================================================
   LEGENDA
   ========================================================================================= */

function renderMapLegendV2() {

    const target =
        getTarget2027();


    let classes =
        MAP_RATE_CLASSES;


    let title =
        "Taxa de distorção idade-série";


    if (
        state.mapMode === "meta"
        &&
        Number.isFinite(
            target
        )
    ) {

        classes =
            MAP_TARGET_CLASSES;


        title =
            `Distância da meta (${target.toFixed(1)}%)`;

    }


    const rows =
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
        .join("");


    mapDom.legend.innerHTML =
        `
        <div class="map-legend-title">
            ${title}
        </div>

        ${rows}

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
   CABEÇALHO DO MAPA
   ========================================================================================= */

function updateMapHeadingV2() {

    mapDom.yearBadge.textContent =
        String(
            state.year
        );


    mapDom.yearOverlay.textContent =
        String(
            state.year
        );


    mapDom.indicatorBadge.textContent =
        selectedIndicatorName();


    mapDom.subtitle.textContent =
        `${state.location} • ${state.dependency}`;

}



/* =========================================================================================
   CARREGAR GEOJSON
   ========================================================================================= */

async function loadMunicipalGeoJSONV2() {

    if (
        DATA.municipalGeoJSON
    ) {

        return DATA.municipalGeoJSON;

    }


    DATA.municipalGeoJSON =
        await loadJSON(
            "./dados/mapa/municipios_rs.geojson"
        );


    return DATA.municipalGeoJSON;

}



/* =========================================================================================
   INICIALIZAR MAPA
   ========================================================================================= */

async function ensureMapLoadedV2() {

    if (
        DATA.mapInitialized
    ) {

        return;

    }


    if (
        typeof L === "undefined"
    ) {

        throw new Error(
            "Leaflet não foi carregado."
        );

    }


    const geojson =
        await loadMunicipalGeoJSONV2();


    DATA.map =
        L.map(
            "mapMunicipios",
            {

                zoomControl:
                    true,

                preferCanvas:
                    true,

                minZoom:
                    5,

                maxZoom:
                    12

            }
        );


    L.tileLayer(

        "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png",

        {

            maxZoom:
                12,

            subdomains:
                "abc",

            attribution:
                '&copy; colaboradores do OpenStreetMap'

        }

    )
    .addTo(
        DATA.map
    );


    DATA.municipalLayer =
        L.geoJSON(

            geojson,

            {

                style:
                    () => ({

                        color:
                            "#ffffff",

                        weight:
                            0.65,

                        opacity:
                            1,

                        fillColor:
                            MAP_NA_COLOR,

                        fillOpacity:
                            0.82

                    }),


                onEachFeature:
                    (
                        feature,
                        layer
                    ) => {

                        layer.on(

                            "mouseover",

                            () => {

                                layer.bringToFront();


                                layer.setStyle(
                                    {

                                        weight:
                                            2,

                                        color:
                                            "#163e4e"

                                    }
                                );

                            }

                        );


                        layer.on(

                            "mouseout",

                            () => {

                                updateMunicipalMapV2();

                            }

                        );


                        layer.on(

                            "click",

                            async () => {

                                state.municipality =
                                    String(
                                        feature.properties.MUNICIPIO_CODIGO
                                    );


                                dom.municipality.value =
                                    state.municipality;


                                state.school =
                                    null;


                                await updateMunicipios();

                            }

                        );

                    }

            }

        )
        .addTo(
            DATA.map
        );


    DATA.map.fitBounds(

        DATA.municipalLayer.getBounds(),

        {

            padding:
                [
                    10,
                    10
                ]

        }

    );


    DATA.mapInitialized =
        true;


    setTimeout(
        () => {

            DATA.map.invalidateSize();

        },
        80
    );

}



/* =========================================================================================
   FILTRAR DADOS MUNICIPAIS DO ANO
   ========================================================================================= */

async function getCurrentMunicipalRowsV2() {

    const rows =
        await loadMunicipalYear(
            state.year
        );


    return rows.filter(
        row =>
            row.LOCALIZACAO
            ===
            state.location
            &&
            row.DEPENDENCIA
            ===
            state.dependency
    );

}



/* =========================================================================================
   ATUALIZAR MAPA
   ========================================================================================= */

async function updateMunicipalMapV2() {

    if (
        state.view !== "municipios"
    ) {

        return;

    }


    await ensureMapLoadedV2();


    syncMapModeAvailabilityV2();

    updateMapHeadingV2();

    renderMapLegendV2();


    const rows =
        await getCurrentMunicipalRowsV2();


    const values =
        new Map();


    rows.forEach(
        row => {

            values.set(
                String(
                    row.MUNICIPIO_CODIGO
                ),
                row[
                    state.indicator
                ]
            );

        }
    );


    const target =
        getTarget2027();


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
                values.has(
                    code
                )
                ?
                values.get(
                    code
                )
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
                        mapColorV2(
                            value
                        ),

                    fillOpacity:
                        0.82,

                    color:
                        selected
                        ?
                        "#123f50"
                        :
                        "#ffffff",

                    weight:
                        selected
                        ?
                        2.4
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
                Number.isFinite(
                    target
                )
                &&
                isValue(
                    value
                )
            ) {

                const delta =
                    Number(
                        value
                    )
                    -
                    target;


                tooltip +=
                    `<br>Meta 2027: ${target.toFixed(1)}%`
                    +
                    `<br>Distância: `
                    +
                    `<strong>${delta >= 0 ? "+" : ""}${delta.toFixed(1)} p.p.</strong>`;

            }


            tooltip +=
                `<br><span style="color:#6d7a80">`
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


    setTimeout(
        () => {

            DATA.map.invalidateSize();

        },
        30
    );

}



/* =========================================================================================
   ANO ANIMADO
   ========================================================================================= */

async function setAnimatedYearV2(
    year
) {

    const minYear =
        Number(
            DATA.manifest.periodo.inicio
        );


    const maxYear =
        Number(
            DATA.manifest.periodo.fim
        );


    state.year =
        Math.max(
            minYear,
            Math.min(
                maxYear,
                Number(
                    year
                )
            )
        );


    dom.year.value =
        String(
            state.year
        );


    await updateCurrentView();

}



/* =========================================================================================
   PARAR ANIMAÇÃO
   ========================================================================================= */

function stopMapAnimationV2() {

    if (
        animationTimer
    ) {

        clearInterval(
            animationTimer
        );


        animationTimer =
            null;

    }


    mapDom.play.textContent =
        "▶ Reproduzir";

}



/* =========================================================================================
   INICIAR ANIMAÇÃO
   ========================================================================================= */

async function startMapAnimationV2() {

    stopMapAnimationV2();


    const minYear =
        Number(
            DATA.manifest.periodo.inicio
        );


    const maxYear =
        Number(
            DATA.manifest.periodo.fim
        );


    if (
        state.year >= maxYear
    ) {

        await setAnimatedYearV2(
            minYear
        );

    }


    mapDom.play.textContent =
        "❚❚ Pausar";


    animationTimer =
        setInterval(

            async () => {

                if (
                    state.year >= maxYear
                ) {

                    stopMapAnimationV2();

                    return;

                }


                await setAnimatedYearV2(
                    state.year + 1
                );

            },

            state.animationSpeed

        );

}



/* =========================================================================================
   MODAL
   ========================================================================================= */

function openMethodologyV2() {

    mapDom.methodologyModal.classList.remove(
        "hidden"
    );


    mapDom.methodologyModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeMethodologyV2() {

    mapDom.methodologyModal.classList.add(
        "hidden"
    );


    mapDom.methodologyModal.setAttribute(
        "aria-hidden",
        "true"
    );

}



/* =========================================================================================
   ENVOLVER updateMunicipios ORIGINAL
   ========================================================================================= */

const updateMunicipiosOriginalV2 =
    updateMunicipios;


updateMunicipios =
    async function () {

        await updateMunicipiosOriginalV2();


        if (
            state.view === "municipios"
        ) {

            await updateMunicipalMapV2();

        }

    };



/* =========================================================================================
   ENVOLVER setView ORIGINAL
   ========================================================================================= */

const setViewOriginalV2 =
    setView;


setView =
    function (
        view
    ) {

        if (
            view !== "municipios"
        ) {

            stopMapAnimationV2();

        }


        setViewOriginalV2(
            view
        );


        if (
            view === "municipios"
        ) {

            setTimeout(
                () => {

                    if (
                        DATA.mapInitialized
                    ) {

                        DATA.map.invalidateSize();

                    }

                },
                120
            );

        }

    };



/* =========================================================================================
   EVENTOS — MODO DO MAPA
   ========================================================================================= */

mapDom.mode.addEventListener(

    "change",

    async () => {

        state.mapMode =
            mapDom.mode.value;


        await updateMunicipalMapV2();

    }

);



/* =========================================================================================
   EVENTO — ANO ANTERIOR
   ========================================================================================= */

mapDom.previous.addEventListener(

    "click",

    async () => {

        stopMapAnimationV2();


        const minYear =
            Number(
                DATA.manifest.periodo.inicio
            );


        await setAnimatedYearV2(
            Math.max(
                minYear,
                state.year - 1
            )
        );

    }

);



/* =========================================================================================
   EVENTO — ANO SEGUINTE
   ========================================================================================= */

mapDom.next.addEventListener(

    "click",

    async () => {

        stopMapAnimationV2();


        const maxYear =
            Number(
                DATA.manifest.periodo.fim
            );


        await setAnimatedYearV2(
            Math.min(
                maxYear,
                state.year + 1
            )
        );

    }

);



/* =========================================================================================
   EVENTO — PLAY / PAUSE
   ========================================================================================= */

mapDom.play.addEventListener(

    "click",

    async () => {

        if (
            animationTimer
        ) {

            stopMapAnimationV2();

        }
        else {

            await startMapAnimationV2();

        }

    }

);



/* =========================================================================================
   EVENTO — VELOCIDADE
   ========================================================================================= */

mapDom.speed.addEventListener(

    "change",

    async () => {

        state.animationSpeed =
            Number(
                mapDom.speed.value
            );


        if (
            animationTimer
        ) {

            await startMapAnimationV2();

        }

    }

);



/* =========================================================================================
   EVENTO — METODOLOGIA
   ========================================================================================= */

mapDom.methodologyButton.addEventListener(
    "click",
    openMethodologyV2
);


mapDom.methodologyClose.addEventListener(
    "click",
    closeMethodologyV2
);


mapDom.methodologyModal.addEventListener(

    "click",

    event => {

        if (
            event.target
            ===
            mapDom.methodologyModal
        ) {

            closeMethodologyV2();

        }

    }

);


document.addEventListener(

    "keydown",

    event => {

        if (
            event.key === "Escape"
        ) {

            closeMethodologyV2();

        }

    }

);



/* =========================================================================================
   AO TROCAR INDICADOR
   ========================================================================================= */

dom.indicator.addEventListener(

    "change",

    () => {

        syncMapModeAvailabilityV2();

    }

);



/* =========================================================================================
   AO TROCAR MANUALMENTE O ANO
   ========================================================================================= */

dom.year.addEventListener(

    "change",

    () => {

        stopMapAnimationV2();

    }

);



/* =========================================================================================
   PREPARAÇÃO INICIAL
   ========================================================================================= */

syncMapModeAvailabilityV2();
