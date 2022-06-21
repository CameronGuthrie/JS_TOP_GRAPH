const colorSixty = '#242a38';
const colorSixtyAlt = 'rgba(75, 80, 100, 0.5)';
const colorThirty = '#ffffff';
const colorMemory = '#fa4965';
const colorMemoryAlt = '#f77f66';
const colorNetwork = '#4c49fa';
const colorNetworkAlt = '#a566f7';
const colorCpu = "#49fa52";
const colorCpuAlt = "#66f7cc";
const colorCpuTemp = '#fae849';
const colorCpuTempAlt = '#b8f766';

const TICK = 1000;

document.body.style.backgroundColor = colorSixty;

const get = async () => {

    const res = await axios.get(`/get`);

    const _output = await res;

    return _output;

};

const memoryLine = (data) => {

    let memPercent = [];

    for (let item of data.dynamic.memory){
        memPercent.push({x : item._id,y : item.used});
    }

    return memPercent;

}

const networkLine = (data) => {
    let netArray = [];
    for (let item of data.dynamic.netstats){
        netArray.push({x : item._id,y : Math.round(item.tx_sec/1000)});
    }
    return netArray;
}

const cpuLine = (data) => {
    let cpuArray = [];
    for (let item of data.dynamic.cpu){
        cpuArray.push({x : item._id,y : item.speed});//100*(item.speed/data.static.cpu.speedMax)});
    }
    console.log(cpuArray);
    return cpuArray;
}

const cpuTempLine = (data) => {
    let cpuTempArray = [];
    for (let item of data.dynamic.cpuTemperature){
        cpuTempArray.push({x : item._id,y : item.main});
    }
    return cpuTempArray;
}

let width, height;
const getGradient = (ctx, chartArea, color1, color2) => {
    let gradient;
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    if (!gradient || width !== chartWidth || height !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        //gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient = ctx.createLinearGradient(chartArea.right, 0, chartArea.left, 0);
        gradient.addColorStop(0, color1);
        //gradient.addColorStop(0.5, Utils.CHART_COLORS.yellow);
        gradient.addColorStop(1, color2);
    }
    return gradient;
}

const buildChart = (ctx) => {
    return new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Memory Usage (%)',
                data: []
            }]
        },
        options: {
            responsive: true,
            elements: {
                point:{
                    radius: 0
                }
            },
            scales: {
                y: {
                    suggestedMin: 0,
                    suggestedMax: 100,
                    position: 'right',
                    ticks: { 
                        color: 'white'
                    },
                    grid : {
                        color: 'white',
                        drawborder: true,
                        // zeroLineColor: 'rgba(0,0,0,0)',
                        tickLength: 0
                    }
                },
                x: {
                    display: false,
                    // suggestedMin: 0,
                    //suggestedMax: lineData.length-1,
                    // autoSkip: true,
                    maxTicksLimit: 20,
                    ticks: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 0
            },
            plugins: {
                tooltip: {
                    enabled: false
                },
                legend: {
                    display: false,
                    labels: {
                        color: 'white',
                        // This more specific font property overrides the global property
                        font: {
                            size: 16,
                            family: 'Arial'
                        }
                    }
                }
            }
        }
    });
}

setInterval(async () => {

    const getData = await get();
    
    /* 
    MEMORY
    */

    let memoryLineData = memoryLine(getData.data);

    /*
    HOW IS CONTEXT CALLED WITH NO ARGUMENTS BEING USED?!?!?!
    */

    let memoryGradient = (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;

        if (!chartArea) {
          // This case happens on initial chart load
          return;
        }
        return getGradient(ctx, chartArea, colorMemory, colorMemoryAlt);
    }

    let networkGradient = (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;

        if (!chartArea) {
          // This case happens on initial chart load
          return;
        }
        return getGradient(ctx, chartArea, colorNetwork, colorNetworkAlt);
    }

    let cpuGradient = (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;

        if (!chartArea) {
          // This case happens on initial chart load
          return;
        }
        return getGradient(ctx, chartArea, colorCpu, colorCpuAlt);
    }

    let cpuTempGradient = (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;

        if (!chartArea) {
          // This case happens on initial chart load
          return;
        }
        return getGradient(ctx, chartArea, colorCpuTemp, colorCpuTempAlt);
    }

    if (memoryLineData.length >= 20) {
        lineDataSliced = memoryLineData.slice(-20);
        memoryLineData = lineDataSliced;
    }

    document.getElementById("memoryNumber").innerHTML = `${JSON.stringify(Math.round(memoryLineData[memoryLineData.length - 1].y))}%`;

    memoryChart.data.datasets = [{
        label: 'Memory Usage (%)',
        data: memoryLineData,
        borderWidth: 5,
        showLine: true,
        fill: true,
        backgroundColor: colorSixtyAlt,
        borderColor: memoryGradient,
        tension: 0.1
    }];

    memoryChart.options.scales.x = {
        suggestedMin: memoryLineData[0].x,
        suggestedMax: memoryLineData[memoryLineData.length-1].x,
        display: false,
        ticks: {
            display: false,
            stepSize: 1
        }
    }
    memoryChart.update();

    /* 
    NETWORK
    */

    let networkLineData = networkLine(getData.data);

    if (networkLineData.length >= 20) {
        lineDataSliced = networkLineData.slice(-20);
        networkLineData = lineDataSliced;
    }

    document.getElementById("networkNumber").innerHTML = `${JSON.stringify(Math.round(networkLineData[networkLineData.length - 1].y))}kbps`;

    networkChart.data.datasets = [{
        label: '',
        data: networkLineData,
        borderWidth: 5,
        showLine: true,
        fill: true,
        backgroundColor: colorSixtyAlt,
        borderColor: networkGradient,
        tension: 0.1
    }];

    networkChart.options.scales.x = {
        suggestedMin: networkLineData[0].x,
        suggestedMax: networkLineData[networkLineData.length-1].x,
        display: false,
        ticks: {
            display: false,
            stepSize: 1
        }
    }

    networkChart.update();

    /*
    CPU SPEED
    */

    let cpuLineData = cpuLine(getData.data);

    if (cpuLineData.length >= 20) {
        lineDataSliced = cpuLineData.slice(-20);
        cpuLineData = lineDataSliced;
    }

    document.getElementById("cpuNumber").innerHTML = `${JSON.stringify(Math.round(cpuLineData[cpuLineData.length - 1].y))}%`;

    cpuChart.data.datasets = [{
        label: '',
        data: cpuLineData,
        borderWidth: 5,
        showLine: true,
        fill: true,
        backgroundColor: colorSixtyAlt,
        borderColor: cpuGradient,
        tension: 0.1
    }];

    cpuChart.options.scales.x = {
        suggestedMin: cpuLineData[0].x,
        suggestedMax: cpuLineData[cpuLineData.length-1].x,
        display: false,
        ticks: {
            display: false,
            stepSize: 1
        }
    }

    cpuChart.update();

    /* 
    CPU TEMP
    */

    // let cpuTempLineData = cpuTempLine(getData.data);

    // if (cpuTempLineData.length >= 20) {
    //     lineDataSliced = cpuTempLineData.slice(-20);
    //     cpuTempLineData = lineDataSliced;
    // }

    // document.getElementById("cpuTempNumber").innerHTML = `${JSON.stringify(Math.round(cpuTempLineData[cpuTempLineData.length - 1].y))}&deg;C`;

    // cpuTempChart.data.datasets = [{
    //     label: '',
    //     data: cpuTempLineData,
    //     borderWidth: 5,
    //     showLine: true,
    //     fill: true,
    //     backgroundColor: colorSixtyAlt,
    //     borderColor: cpuTempGradient,
    //     tension: 0.1
    // }];

    // cpuTempChart.options.scales.x = {
    //     suggestedMin: cpuTempLineData[0].x,
    //     suggestedMax: cpuTempLineData[cpuTempLineData.length-1].x,
    //     display: false,
    //     ticks: {
    //         display: false,
    //         stepSize: 1
    //     }
    // }

    // cpuTempChart.update();
    
}, TICK);



let memoryChart = buildChart(document.getElementById('memoryChart').getContext('2d'));

let networkChart = buildChart(document.getElementById('networkChart').getContext('2d'));

let cpuChart = buildChart(document.getElementById('cpuChart').getContext('2d'));

// let cpuTempChart = buildChart(document.getElementById('cpuTempChart').getContext('2d'));