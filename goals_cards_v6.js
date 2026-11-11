"use strict";


/* =========================================================================================
   TDI — V6
   CARDS ESTADUAIS DAS METAS PPA 2027
   ========================================================================================= */


const PPA_GOALS_V6 = [

    {
        field: "TDI_FUN_AI",
        target: 0,
        currentId: "goalAiCurrent",
        distanceId: "goalAiDistance",
        statusId: "goalAiStatus"
    },

    {
        field: "TDI_FUN_AF",
        target: 10,
        currentId: "goalAfCurrent",
        distanceId: "goalAfDistance",
        statusId: "goalAfStatus"
    },

    {
        field: "TDI_MED",
        target: 10,
        currentId: "goalEmCurrent",
        distanceId: "goalEmDistance",
        statusId: "goalEmStatus"
    }

];


function normalizeGoalTextV6(value) {

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


function isRsGoalRowV6(row) {

    const code =
        String(
            row.UF_CODIGO
            ??
            row.CO_UF
            ??
            row.CD_UF
            ??
            ""
        )
        .replace(/\.0$/, "")
        .trim();


    const sigla =
        normalizeGoalTextV6(
            row.UF_SIGLA
            ??
            row.SG_UF
            ??
            row.SIGLA_UF
        );


    const name =
        normalizeGoalTextV6(
            row.UF_NOME
            ??
            row.NO_UF
            ??
            row.NM_UF
        );


    return (
        code === "43"
        ||
        sigla === "rs"
        ||
        name === "rio grande do sul"
    );

}


function stateGoalRowV6() {

    const rows =
        Array.isArray(DATA.estadosDetalhe)
        ?
        DATA.estadosDetalhe
        :
        (
            Array.isArray(DATA.estados)
            ?
            DATA.estados
            :
            []
        );


    return rows.find(
        row =>

            isRsGoalRowV6(row)

            &&

            Number(row.ANO)
            ===
            Number(state.year)

            &&

            normalizeGoalTextV6(row.LOCALIZACAO)
            ===
            "total"

            &&

            normalizeGoalTextV6(row.DEPENDENCIA)
            ===
            "estadual"
    );

}


function formatPercentGoalV6(value) {

    if (
        value === null
        ||
        value === undefined
        ||
        value === ""
        ||
        !Number.isFinite(Number(value))
    ) {

        return "NA";

    }


    return (
        Number(value)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }
        )
        +
        "%"
    );

}


function formatPpGoalV6(value) {

    return (
        Math.abs(Number(value))
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }
        )
        +
        " p.p."
    );

}


function renderStateGoalCardV6(config, value) {

    const current =
        document.getElementById(
            config.currentId
        );


    const distance =
        document.getElementById(
            config.distanceId
        );


    const status =
        document.getElementById(
            config.statusId
        );


    if (
        !current
        ||
        !distance
        ||
        !status
    ) {

        return;

    }


    const card =
        current.closest(
            ".state-goal-card"
        );


    card?.classList.remove(
        "goal-achieved",
        "goal-unavailable"
    );


    if (
        value === null
        ||
        value === undefined
        ||
        value === ""
        ||
        !Number.isFinite(Number(value))
    ) {

        current.textContent =
            "NA";


        distance.textContent =
            "—";


        status.textContent =
            "Sem taxa publicada para este recorte no ano selecionado.";


        card?.classList.add(
            "goal-unavailable"
        );


        return;

    }


    const observed =
        Number(value);


    const delta =
        observed
        -
        config.target;


    current.textContent =
        formatPercentGoalV6(
            observed
        );


    if (
        delta > 0
    ) {

        distance.textContent =
            "+"
            +
            formatPpGoalV6(
                delta
            );


        status.textContent =
            "Faltam "
            +
            formatPpGoalV6(
                delta
            )
            +
            " de redução para atingir a meta.";


        return;

    }


    card?.classList.add(
        "goal-achieved"
    );


    if (
        Math.abs(delta) < 0.000001
    ) {

        distance.textContent =
            "0,0 p.p.";


        status.textContent =
            "Meta atingida.";


        return;

    }


    distance.textContent =
        "−"
        +
        formatPpGoalV6(
            delta
        );


    status.textContent =
        "Meta atingida: "
        +
        formatPpGoalV6(
            delta
        )
        +
        " abaixo do patamar de 2027.";

}


function renderStateGoalsV6() {

    const row =
        stateGoalRowV6();


    const yearContext =
        document.getElementById(
            "stateGoalsYearContext"
        );


    if (
        yearContext
    ) {

        yearContext.textContent =
            "Ano observado: "
            +
            state.year;

    }


    for (
        const config
        of
        PPA_GOALS_V6
    ) {

        renderStateGoalCardV6(
            config,
            row?.[
                config.field
            ]
        );

    }


    const mapMode =
        document.getElementById(
            "mapModeSelect"
        );


    if (
        mapMode
    ) {

        mapMode.value =
            "taxa";

    }


    const mapNote =
        document.getElementById(
            "mapBenchmarkNote"
        );


    if (
        mapNote
    ) {

        mapNote.innerHTML =
            "O mapa apresenta somente a <strong>taxa observada</strong>. "
            +
            "As metas do PPA são estaduais e estão sintetizadas nos cards acima.";

    }

}


/* =========================================================================================
   ACOPLAR À ATUALIZAÇÃO MUNICIPAL
   ========================================================================================= */

const updateMunicipiosAntesV6 =
    updateMunicipios;


updateMunicipios =
    async function () {

        await updateMunicipiosAntesV6();


        if (
            state.view
            ===
            "municipios"
        ) {

            renderStateGoalsV6();

        }

    };
