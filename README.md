# Painel TDI — Taxa de Distorção Idade-Série

Painel interativo para análise histórica e territorial da **Taxa de Distorção Idade-Série (TDI)**, com dados oficiais do Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira — **Inep**.

O painel cobre o período **2007–2025** e organiza as informações segundo a hierarquia:

**Brasil → Unidades da Federação → Municípios do Rio Grande do Sul → Escolas do Rio Grande do Sul**

## Indicadores

O painel trabalha com quatro indicadores harmonizados ao longo da série histórica:

- **Ensino Fundamental — Total**
- **Ensino Fundamental — Anos Iniciais**
- **Ensino Fundamental — Anos Finais**
- **Ensino Médio — Total**

As taxas são apresentadas em percentual.

Ausência de informação é tratada como **NA**, nunca como zero.

## Fonte dos dados

**Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira — Inep**

Indicadores Educacionais — Taxas de Distorção Idade-Série:

https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/taxas-de-distorcao-idade-serie

## Conceito

A Taxa de Distorção Idade-Série expressa o percentual de estudantes matriculados em determinada série ou grupo de séries com idade superior à idade recomendada para aquela etapa da trajetória escolar.

No critério operacional utilizado pelo Inep, considera-se em situação de distorção o estudante que completa, no ano de referência, **dois anos ou mais acima da idade adequada para a série frequentada**.

## Abrangência territorial

O painel permite análises em quatro níveis:

**Brasil**

**Unidades da Federação — 27 UFs**

**Municípios do Rio Grande do Sul — 497 municípios**

**Escolas do Rio Grande do Sul**

A série municipal mantém a malha atual de **497 municípios** em todos os anos. Quando não existe informação histórica para uma unidade territorial, o valor permanece como **NA**.

No caso de **Pinto Bandeira**, os anos de 2007 a 2012 são mantidos como NA.

## Dimensões analíticas

Além da etapa de ensino, o painel permite análises por:

- ano;
- localização;
- dependência administrativa;
- município;
- escola;
- abrangência territorial.

Os comparadores permitem visualizar o município selecionado, o **Rio Grande do Sul** ou a comparação **Município × Rio Grande do Sul**.

Os valores estaduais utilizados nessas comparações correspondem às **taxas oficiais da UF publicadas pelo Inep** e não a médias calculadas a partir dos municípios.

## Mapa municipal

O painel contém mapa interativo dos **497 municípios do Rio Grande do Sul**, com:

- mapa coroplético;
- filtros por ano, indicador, localização e dependência;
- seleção de municípios;
- ranking municipal;
- animação temporal de 2007 a 2025;
- identificação de municípios sem informação;
- comparação com metas de referência quando aplicável.

A geometria municipal utilizada corresponde à malha municipal do Rio Grande do Sul de 2024, convertida para **EPSG:4326** e simplificada para utilização na web.

O mapa de fundo utiliza Leaflet e tiles do OpenStreetMap. Serviços públicos de tiles são utilizados em regime de melhor esforço e podem apresentar diferenças de comportamento conforme o ambiente de execução.

## Metas PPA 2024–2027

O painel incorpora metas de referência previstas no:

**RIO GRANDE DO SUL. Secretaria de Planejamento, Governança e Gestão. Departamento de Planejamento Governamental. Plano Plurianual 2024–2027. Porto Alegre: Secretaria de Planejamento, Governança e Gestão, 2023.**

Documento:

https://planejamento.rs.gov.br/upload/arquivos/202311/28172943-mensagem-ppa-2024-2027-pos-emenda-28112023-final-1.pdf

Metas para 2027 referentes à **rede pública estadual**:

| Etapa | Meta 2027 |
|---|---:|
| Ensino Fundamental — Anos Iniciais | 0% |
| Ensino Fundamental — Anos Finais | 10% |
| Ensino Médio — Total | 10% |

Por essa razão, a análise de distância em relação às metas é aplicada ao recorte:

**Localização = Total**  
**Dependência = Estadual**

A comparação municipal representa a distância em relação ao patamar estadual definido no PPA e não deve ser interpretada como existência de uma meta municipal formal.

## Estrutura do painel

```text
/
├── index.html
├── styles.css
├── app.js
├── map_v2.js
├── enhancements_v3.js
├── compare_rs_v5.js
├── manifest.json
├── .nojekyll
└── dados/
    ├── brasil_detalhe.json
    ├── estados_detalhe.json
    ├── brasil_total_total.json
    ├── estados_total_total.json
    ├── municipios_total_total.json
    ├── dim_ufs.json
    ├── dim_municipios_rs.json
    ├── escolas_index.json
    ├── escolas_resumo_anual.json
    ├── mapa/
    │   └── municipios_rs.geojson
    ├── municipios/
    │   ├── 2007.json
    │   ├── ...
    │   └── 2025.json
    └── escolas/
        └── 497 arquivos municipais
```

## Publicação automatizada

A publicação utiliza um pacote completo:

```text
TDI_PAINEL_V5_GITHUB.zip
```

O ZIP deve ser enviado **sem ser descompactado** para a raiz do repositório.

O workflow localizado em:

```text
.github/workflows/importar-painel.yml
```

é acionado automaticamente quando o ZIP é enviado.

O workflow:

1. baixa o conteúdo do repositório;
2. valida a existência do ZIP;
3. remove a versão anterior dos arquivos do painel;
4. descompacta o novo pacote na raiz;
5. remove o ZIP;
6. valida os arquivos essenciais;
7. valida os 497 municípios do GeoJSON;
8. valida os 19 arquivos anuais de municípios;
9. valida os 497 arquivos municipais de escolas;
10. realiza um commit automático com a nova versão do painel.

Dessa forma, não é necessário enviar individualmente centenas de arquivos pelo navegador do GitHub.

## GitHub Pages

Após a importação automática do pacote:

**Settings → Pages**

Em **Build and deployment** selecionar:

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

Depois clicar em **Save**.

O `index.html` deve permanecer diretamente na raiz do repositório.

A página será publicada no formato:

```text
https://<usuario>.github.io/<repositorio>/
```

## Pacote atualmente validado

Versão do painel: **V5**

Período: **2007–2025**

Arquivos no pacote: **536**

Dados JSON: **526 arquivos**

Arquivos municipais anuais: **19**

Arquivos escolares: **497**

Municípios no mapa: **497**

Tamanho total descompactado: **aproximadamente 69,63 MB**

Pacote compactado:

```text
TDI_PAINEL_V5_GITHUB.zip
```

Tamanho: **aproximadamente 5,49 MB**

SHA-256:

```text
8c74751559bf8c412b66397ddf5f5db43c1457355c502a8097e2aa336026a4d5
```

## Tecnologias

- HTML
- CSS
- JavaScript
- Plotly
- Leaflet
- GeoJSON
- GitHub Actions
- GitHub Pages

## Observação

O painel é um produto de organização, harmonização e visualização de bases públicas oficiais. As taxas originais de Brasil, unidades da Federação e municípios são preservadas conforme publicadas pelo Inep, evitando a geração de agregados territoriais por médias aritméticas das unidades inferiores.
