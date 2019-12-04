import {
    processData,
    getYearSales,
    getAllplatforms,
    makeYear2salesPlatform
} from './utils';

import * as d3 from 'd3';
const w = window.innerWidth * .69;
const h = window.innerHeight;
const padding = 90;
const yearParser = d3.timeParse('%Y');
const currScale = [1980, 1995];

const colorScheme = [
    "#4c5270",
    "#C26DBC",
    "#36EEE0",
    "#EDC1BB",
    "#0C6980",
    "#C4DBE0",
    "#CE2380",
    "#2D3A3E",
    "#DEE2EC",
    "#8C756A",
    "#EEB5EB",
    "#C6D830",
    "#A3EBB1",
    "#AE8B70",
    "#543855",
    "#81B622",
    "#21B6A8",
    "#73D9F0",
    "#F7B301",
    "#EB773E",
    "#B7A1A6",
    "#854B5B"
]

const makeClip = (viz, target) => {
    return viz.append("clipPath")
            .attr("id", `clip-${target}`)
            .append("rect")
            .attr("width", 0)
            .attr("height", h);
}

const makeLabel = (labels: any, i: number, x: number, y: number, text: string, isOpa=true) => {
    const dot = labels.append('g')
            .attr('class', 'dots')
            .attr('id', `label-${text}`)
            .on('mouseenter', () => {
                d3.selectAll('.layer').transition().duration(500).style('opacity', .1);
                if (text === 'atari') d3.select(`.layer-2600`).transition().duration(500).style('opacity', 1)
                d3.select(`.layer-${text}`).transition().duration(500).style('opacity', 1)
            })
            .on('mouseleave', () => {
                d3.selectAll('.layer').transition().duration(500).style('opacity', 1);
            })
            .style('opacity', isOpa ? 0 : 1);


        dot.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 5)
        .style('fill', colorScheme[i] )

        dot.append('text')
        .attr('x', x + 10)
        .attr('y', y)
        .text(text)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style('fill', colorScheme[i] )
}

const makeUpdate = (xScale, yScale, selectData, xAxisGroup, yAxisGroup, areaChart, area) => {
    xScale.domain(currScale.map((it) => yearParser(it)));
    const yMax = d3.max(selectData, (d) => d.sales);
    yScale.domain([0, yMax])
    yAxisGroup
        .call(d3.axisLeft(yScale));
    xAxisGroup
        .call(d3.axisBottom(xScale));
    areaChart.selectAll('.layer')
        .attr('d', area)
    // areaChart.selectAll('.line')
    //     .attr('d', lineMaker)


}

const swapTwo = (arr, first, second) => {
    const temp = arr[first];
    arr[first] = arr[second];
    arr[second] = temp;
    return arr;
}

const main = async () => {
    const viz = d3.select('#display').append('svg')
        .style('width', w)
        .style('height', h);
    const labels = viz.append('g')
        .attr('class', 'labels')
        .style('transform', `translate(${10}px, ${5}px)`)
    const {
        rawData,
        data
    } = await processData();
    document.getElementById('column').style.overflowY = 'auto'
    document.getElementById('scroller').animate([
        {
            opacity: 0
        },
        {
            opacity: 1
        }
    ], {
        duration: 1000,
        fill: 'forwards'
    });
    document.getElementById('first-desc').animate([
        {
            opacity: 0
        },
        {
            opacity: 1
        }
    ], {
        duration: 1000,
        fill: 'forwards'
    })
    const years = Array.from(new Set(rawData.map((it) => it.yearOfRelease)))
        .filter((it) => it !== 'N/A')
        .filter((it) => it !== '2017')
        .filter((it) => it !== '2016')
        .filter((it) => it !== '2020').sort((a, b) => {
            if (a < b) return -1
            else return 1;
        });

    const salesData = getYearSales(years, data);
    let selectYears = years.filter((it) => parseInt(it) <= 2003);
    let selectData = salesData.filter((it) => it.year.getFullYear() <= 2003);
    let allPlatforms = getAllplatforms(selectData);

    const flattenData = salesData.map((it) => {
        const d = {
            year: it.year
        }
        allPlatforms.forEach((i) => d[i] = 0);
        Object.keys(it.platformSales).forEach((i) => {
            d[i] = it.platformSales[i];
        });
        return d
    });
    let platformData = makeYear2salesPlatform(allPlatforms, selectData, selectYears);
    allPlatforms = swapTwo(allPlatforms, 2, 4)
    allPlatforms = swapTwo(allPlatforms, 2, 5)
    allPlatforms = swapTwo(allPlatforms, 3, 5)
    console.log(allPlatforms)
    let stackData = d3.stack()
        .keys(allPlatforms)(flattenData);
    const colorScale = d3.scaleSequential().domain([0,allPlatforms.length - 1]).interpolator(d3.interpolateTurbo);
    let yMax = d3.max(selectData, (d) => d.sales);
    const xDomain = d3.extent(selectData, (d) => d.year);
    const yDomain = [0, yMax];

    const xScale = d3.scaleTime().domain(xDomain).range([padding, w - padding]);
    const yScale = d3.scaleLinear().domain(yDomain).range([h - padding, padding]);

    const xAxis = d3.axisBottom(xScale);
    const xAxisGroup = viz.append("g")
        .attr("class", "xaxisgroup")
        .style('font-family', `'Press Start 2P', cursive`)
        .attr("transform", "translate(0," + (h - padding) + ")");
    xAxisGroup.call(xAxis);

    const yAxis = d3.axisLeft(yScale);
    const yAxisGroup = viz.append("g")
        .attr("class", "yaxisgroup")
        .style('font-family', `'Press Start 2P', cursive`)
        .attr("transform", "translate(" + (padding / 2) + ",0)");
    yAxisGroup.call(yAxis);


    const clip = viz.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", w)
        .attr("height", h)
        .attr("x", padding)
        .attr("y", 0);

    const areaChart = viz.append('g').attr("clip-path", "url(#clip)")

    const area = d3.area()
        .x((d) => xScale(d.data.year))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]));
    areaChart.selectAll('layers')
        .data(stackData)
        .enter()
        .append('path')
        .style('fill', (d, i) => {
            return colorScheme[i]
        })
        .attr("clip-path", (d) => `url(#clip-${d.key})`)
        .attr('class', (d) => `layer-${d.key} ${makeClip(viz, d.key)} layer`)
        .attr('d', area);
    const lineMaker = d3.line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.sales));
    makeUpdate(xScale, yScale, selectData.filter((it) => it.year.getFullYear() <= 1994), xAxisGroup, yAxisGroup, areaChart, area);

    areaChart.selectAll('.line').data([selectData.filter((it) => it.year.getFullYear() <= 1995)])
        .enter()
        .append("path")
        .attr('class', 'line global')
        .attr("d", lineMaker)
        .attr('stroke', 'black')
        .attr('stroke-width', '2px')
        .style('fill', 'none')

        const globalLine = viz.select('.global');
        const globalNode = globalLine.node() as SVGPathElement;
        const length = globalNode.getTotalLength();
        const scale = d3.scaleLinear().domain([0, window.innerHeight]).range([length, 0]);
        globalLine.attr("stroke-dasharray", length + " " + length)
        .attr("stroke-dashoffset", length);

    makeLabel(labels, 0, 10, 10, 'atari');
    makeLabel(labels, 1, 80, 10, 'NES');
    makeLabel(labels, 2, 150, 10, 'SNES');
    makeLabel(labels, 3, 230, 10, 'GB');
    let x = 280;
    let y = 10;
    [ "PC", "DS", "GEN", "GG", "SCD", "NG", "PS", "SAT" ].forEach((it, i) => {
        makeLabel(labels, i+4, x, y, it);
        x += 80;
        if (x > 800) {
            x = 10;
            y += 30;
        }
    });
    ["3DO", "TG16", "N64", "PCFX", "DC", "WS", "PS2", "XB", "GBA", "GC"].forEach((it, i) => {
        makeLabel(labels, i+12, x, y, it);
        x += 80;
        if (x > 800) {
            x = 10;
            y += 30;
        }
    });
    const opacityScale = d3.scaleLinear().domain([0, window.innerHeight]).range([0, 1]);

    const column = document.getElementById('column');
    column.addEventListener('scroll', (e) => {
        const pageNum = Math.floor(column.scrollTop / window.innerHeight);
        let op = opacityScale(column.scrollTop % window.innerHeight);

        switch (pageNum) {
            case 0:

                globalLine.attr("stroke-dashoffset", scale(column.scrollTop));
                break;
            case 1:
                const atariScale = d3.scaleLinear().domain([0, window.innerHeight]).range([0, xScale(yearParser('1992'))]);
                const atariClip = d3.select('#clip-2600 rect')
                atariClip.attr("width", atariScale(column.scrollTop % window.innerHeight));
                d3.select('#label-atari').style('opacity', opacityScale(column.scrollTop % window.innerHeight));
                // d3.select('#label-atari').style('opacity', opacityScale(column.scrollTop % window.innerHeight));
    
                break;
            case 2:
                const nesScale = d3.scaleLinear().domain([0, window.innerHeight]).range([ xScale(yearParser('1982')), xScale(yearParser('1995'))]);
                const nesClip = d3.select('#clip-nes rect');
                const snesClip = d3.select('#clip-snes rect');
                const gbClip = d3.select('#clip-gb rect')
                nesClip.attr("width", nesScale(column.scrollTop % window.innerHeight));
                snesClip.attr("width", nesScale(column.scrollTop % window.innerHeight));
                gbClip.attr("width", nesScale(column.scrollTop % window.innerHeight));
                d3.select('#label-nes').style('opacity', op);
                d3.select('#label-snes').style('opacity', op);
                d3.select('#label-gb').style('opacity', op);
                break;
            case 3:
                const other90 = d3.scaleLinear().domain([0, window.innerHeight]).range([ xScale(yearParser('1988')), xScale(yearParser('1995'))]);
                [ "PC", "DS", "GEN", "GG", "SCD", "NG", "PS", "SAT" ].forEach((it) => {
                    const clip = d3.select(`#clip-${it} rect`);
                    clip.attr("width", other90(column.scrollTop % window.innerHeight));
                    d3.select(`#label-${it}`).style('opacity', op);
                })
                break;
            case 4:
                const trans9010 = d3.scaleLinear().domain([0, window.innerHeight]).range([ 1995, 2004]);
                const year =Math.floor(trans9010(column.scrollTop % window.innerHeight));
                currScale[1] = year;
        
                makeUpdate(xScale, yScale, selectData.filter((it) => it.year.getFullYear() <= year), xAxisGroup, yAxisGroup, areaChart, area);
                const l = viz.select('.line');
                const temp = salesData.filter((it) => it.year.getFullYear() <= trans9010(column.scrollTop % window.innerHeight));
                l.attr('d', lineMaker(temp));
                break;
            case 5:
                const scale1 = d3.scaleLinear().domain([0, window.innerHeight]).range([ xScale(yearParser('1995')), xScale(yearParser('2004'))]);

                const platforms = ["3DO", "TG16", "N64", "PCFX", "DC", "WS", "PS2", "XB", "GBA", "GC"];
                platforms.forEach((it) => {
                    d3.select(`#clip-${it} rect`).attr('width', scale1(column.scrollTop % window.innerHeight))
                    d3.select(`#label-${it}`).style('opacity', op);
                });
                break;
            default:
                console.log(pageNum)
        }
    });
    // document.getElementById('up').addEventListener('click', () => {
    //     currScale[1] += 1;
    //     xScale.domain(currScale.map((it) => yearParser(it)));
    //     xAxisGroup
    //                         .call(d3.axisBottom(xScale));
    //                         areaChart.selectAll('path')
    //                         .attr('d', area)

}

main();