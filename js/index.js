const origins = ["Asia", "Europe", "Africa", "Americas", "Oceania"],
    dataOptions = ["confirmed", "critical", "deaths", "recovered"],
    originBtnContainer = document.querySelector(".origin-btn-container"),
    dataBtnContainer = document.querySelector(".data-btn-container"),
    statics = document.querySelector(".statics"),
    singleCountry = document.querySelector(".country"),
    originsCountrys = {},
    worldCountrys = {},
    ctx = document.getElementById('myChart').getContext('2d'),
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'confirmed',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {

                    beginAtZero: true
                }
            }
        }
    });
let savedInfo = "confirmed",
    savedBtn,
    savedDataBtn,
    savedOrigin = "Asia";

const createHtmlBtns = () => {
    for (const i of origins) {
        createBtn(i, originBtnContainer, updateOriginChartPress, i === "Asia")
    }
    for (const i of dataOptions) {
        createBtn(i, dataBtnContainer, updateDataChartPress, i === "confirmed")
    }
    singleCountry.addEventListener("change", singleCountryData)
}

const createBtn = (val, appendTo, onClick, flag) => {
    const btn = document.createElement("input")
    btn.type = "submit"
    btn.value = val;
    appendTo.append(btn)
    btn.addEventListener("click", onClick)
    if (flag) {
        if (appendTo === originBtnContainer) {
            btn.style.background = "rgba(153, 45, 45, 0.555)"
            savedBtn = btn;
        }
        else {
            btn.style.background = "rgba(233, 8, 8, 0.555)"
            savedDataBtn = btn
        }
    }
}

function singleCountryData() {
    statics.innerHTML = ""
    let obj = {
        "Total cases": worldCountrys[this.value].latest_data.confirmed,
        "Total deaths": worldCountrys[this.value].latest_data.deaths,
        "Critical": worldCountrys[this.value].latest_data.critical,
        "Total recovered": worldCountrys[this.value].latest_data.recovered
    }
    if (worldCountrys[this.value].timeline[0]) {
        obj["New deaths"] = worldCountrys[this.value].timeline[0].new_deaths;
        obj["New cases"] = worldCountrys[this.value].timeline[0].new_confirmed;
    }
    for (let i in obj) {
        const box = document.createElement("div")
        box.innerHTML = `<h3>${i}:</h3>
        <h4>${obj[i]}</h4>`
        box.classList.add("box")
        statics.append(box)
    }
}

async function fetchData(originName) {//gets origing name and insert the data to origin countrys const
    const allCountrys = await (await fetch(`https://api.allorigins.win/raw?url=https://restcountries.herokuapp.com/api/v1/region/${originName}`)).json(),
        coronaUrl = "https://corona-api.com/countries/";
    originsCountrys[originName] = await allCountrys.reduce(async (temp, val) => {
        const url = coronaUrl + val.cca2
        temp = await temp
        if (val.cca2 != "XK")
            await fetch(url)
                .then(async (data) => {
                    if (data.ok) {
                        data = await data.json()
                        temp.push(data.data)
                        worldCountrys[data.data.name] = data.data
                    }
                    else {
                        throw new Error("catch Failed")
                    }
                }).catch(err => {
                    console.log(err);
                })
        return temp
    }, [])
}
async function updateOriginChartPress() {
    updateChart(this.value)
    statics.innerHTML = ""
    savedBtn.style.background = "rgba(102, 77, 77, 0.555)";
    savedBtn = this;
    this.style.background = "rgba(153, 45, 45, 0.555)";
    singleCountry.innerHTML = ""
}
async function updateDataChartPress() {
    savedInfo = this.value
    updateChart(savedOrigin)
    savedDataBtn.style.background = "rgba(92, 6, 6, 0.555)"
    savedDataBtn = this;
    this.style.background = "rgba(233, 8, 8, 0.555)"
}

async function updateChart(originName, flag = true) {//get origin name and change it to the saved data required (confirmed/critical...)
    const xs = [],
        ys = [];
    await new Promise(async (res, rej) => {
        for (const i of originsCountrys[originName]) {
            xs.push(i.name)
            ys.push(await (stringToVar(i)))
            await createOption(i.name)
        }
        res()
    })
    myChart.data.datasets[0].data = ys
    myChart.data.datasets[0].label = savedInfo
    myChart.data.labels = xs
    myChart.update();
    savedOrigin = originName
}
async function createOption(countryName) {
    const option = document.createElement("option")
    option.value = countryName
    option.innerText = countryName
    singleCountry.append(option)
}
async function firstRun() {
    const currentOrigin = origins[0]
    await fetchData(currentOrigin)
    await updateChart(currentOrigin)
    removeLoad()
    createHtmlBtns()
    origins.splice(0, 1)
    while (origins.length > 0) {
        await fetchData(origins[0])
        origins.splice(0, 1)
    }
}
function removeLoad(){
    document.querySelector("#load").remove()
}
async function stringToVar(i) {//convert and return the right required data on country
    return savedInfo === dataOptions[0] ? i.latest_data.confirmed : savedInfo === dataOptions[1] ? i.latest_data.critical : savedInfo === dataOptions[2] ? i.latest_data.deaths : i.latest_data.recovered
}
firstRun()