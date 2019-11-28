import {
    VideoGame,
    SalesData
} from './types';
import * as d3 from 'd3';
import {
    processData,
    getYearSales,
    getAllplatforms,
    makeYear2salesPlatform
} from './utils';

const w = window.innerWidth * .69;
const h = window.innerHeight;
const padding = 90;

const legends = [];

const makeClip = (target: string, viz: any) => {
    return viz.append("clipPath")
                        .attr("id", `clip-${target}`)
                        .append("rect")
                        .attr("width", 0)
                        .attr("height", h);
}

const makeLabel = (labels: any, text: string, x: number, y: number, color: string, className: string, isOpa=true) => {
    const dot = labels.append('g')
            .attr('class', 'dots')
            .attr('id', className)
            .style('opacity', isOpa ? 0 : 1);

        dot.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 5)
        .style('fill', color)

        dot.append('text')
        .attr('x', x + 10)
        .attr('y', y)
        .text(text)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style('fill', color)
}

const makeArea = (platform: string, ys: Array<number>, color: string, viz: any, platformData: any, xScale: any, yScale: any, target?: string) => {
    if (!target) target = platform.toLowerCase();
    viz.append('path')
        .data(platformData.filter((it) => it[0].platform === platform))
        .attr('fill', color)
        .attr('class', platform)
        .attr("clip-path", `url(#clip-${target})`)
        // @ts-ignore
        .attr('d', d3.area().x((d) => xScale(d.year))
                            .y0((d, i) => {
                                return yScale(ys[i]);
                            })
                            .y1((d, i) =>  {
                            ys[i] += d.sales;
                                return yScale(ys[i])
                            } )
        );
    }

const main = async () => {

    const viz = d3.select('#display').append('svg')
        .style('width', w)
        .style('height', h);

    const labels = viz.append('g')
        .attr('class', 'labels')
        .style('transform', `translate(${10}px, ${5}px)`)

    const colorSet90 = [
        '#3fc5f0',
        '#42dee1',
        '#6decb9',
        '#29a19c',
        '#9be3de',
        '#ee4540',
        '#2c7873',
        '#2e279d',
        '#8b2f97',
        '#9fdfcd',
        '#baabda'
    ]

    const column = document.getElementById('column');


    const {
        rawData,
        data
    } = await processData();

    const years = Array.from(new Set(rawData.map((it) => it.yearOfRelease)))
        .filter((it) => it !== 'N/A')
        .filter((it) => it !== '2017')
        .filter((it) => it !== '2016')
        .filter((it) => it !== '2020').sort((a, b) => {
            if (a < b) return -1
            else return 1;
        });

    const salesData = getYearSales(years, data);

    const yearParser = d3.timeParse('%Y');

    let selectYears = years.filter((it) => parseInt(it) <= 1995);
    const selectData = salesData.filter((it) => it.year.getFullYear() <= 1995);
    let allPlatforms = getAllplatforms(selectData);
    const platformData = makeYear2salesPlatform(allPlatforms, selectData, selectYears);


    let yMax = d3.max(selectData, (d) => d.sales);
    const xDomain = d3.extent(selectData, (d) => d.year);
    const yDomain = [0, yMax];

    const xScale = d3.scaleTime().domain(xDomain).range([padding, w - padding]);
    const yScale = d3.scaleLinear().domain(yDomain).range([h - padding, padding]);


    const atariClip = makeClip('atari', viz);
    const nesClip = makeClip('nes', viz);
    const other90Clip = makeClip('other-90', viz);
    const opacityScale = d3.scaleLinear().domain([0, window.innerHeight]).range([0, 1]);


    column.addEventListener('scroll', (e) => {
        const pageNum = Math.floor(column.scrollTop / window.innerHeight);

        switch (pageNum) {
            case 0:
                const globalLine = viz.select('.global');
                const globalNode = globalLine.node() as SVGPathElement;
                const length = globalNode.getTotalLength();
                const scale = d3.scaleLinear().domain([0, window.innerHeight]).range([length, 0]);
            
                globalLine.attr("stroke-dashoffset", scale(column.scrollTop));
                break;
            case 1:
                const atari = d3.select('.atari').node().getTotalLength();
                const atariScale = d3.scaleLinear().domain([0, window.innerHeight]).range([0, xScale(yearParser('1992'))]);
                atariClip.attr("width", atariScale(column.scrollTop % window.innerHeight))
                d3.select('#label-atari').style('opacity', opacityScale(column.scrollTop % window.innerHeight));

                break;
            case 2:
                const nesScale = d3.scaleLinear().domain([0, window.innerHeight]).range([ xScale(yearParser('1982')), xScale(yearParser('1996'))]);
                nesClip.attr("width", nesScale(column.scrollTop % window.innerHeight));
                let op = opacityScale(column.scrollTop % window.innerHeight);
                d3.select('#label-nes').style('opacity', op);
                d3.select('#label-snes').style('opacity', op);
                break;
            case 3:
                const other90Scale = d3.scaleLinear().domain([0, window.innerHeight]).range([ xScale(yearParser('1987')), xScale(yearParser('1996'))]);
                other90Clip.attr("width", other90Scale(column.scrollTop % window.innerHeight));
                let op = opacityScale(column.scrollTop % window.innerHeight);
                d3.select('#label-other-90').style('opacity', op);
                break;
            default:
                console.log(pageNum)
        }
    });


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

    const lineMaker = d3.line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.sales));

    const globalLine = viz.selectAll(".global").data([selectData])
        .enter()
        .append("path")
        .attr('class', 'line global')
        .attr("d", lineMaker)
        .attr('stroke', 'black')
        .attr('stroke-width', '2px')
        .style('fill', 'none')
        .style('opacity', 1);

    let totalLength = globalLine.node().getTotalLength();

    globalLine.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength);

    const ys = [];

    viz.append('path')
        .data(platformData.filter((it) => it[0].platform === '2600'))
        .attr('class', 'atari')
        .attr("fill", "#de5246")
        .attr("clip-path", "url(#clip-atari)")
        //@ts-ignore
        .attr("d", d3.area()
            .x((d) => xScale(d.year))
            .y0(yScale(0))
            .y1((d) => {
                const y = yScale(d.sales);
                ys.push(d.sales)
                return y;
            })
        );

    makeLabel(labels, 'Atari-2600', 10, 10, "#de5246", 'label-atari');

    makeArea("NES", ys, '#36b5b0', viz, platformData, xScale, yScale);
    makeLabel(labels, 'NES', 130, 10, "#36b5b0", 'label-NES');
    makeArea("SNES", ys, '#9dd8c8', viz, platformData, xScale, yScale, 'nes');
    makeLabel(labels, 'Super NES', 200, 10, "#9dd8c8", 'label-SNES');
    let x = 300;
    let y = 10;
    const others90 = labels.append('g').attr('id', 'label-other-90').style('opacity', 0);
    platformData.map(
        (it) => it[0].platform
    ).filter((it) => it !== '2600' && it !== 'NES' && it !== 'SNES')
    .forEach((it, i) => {
        makeArea(it, ys, colorSet90[i], viz, platformData, xScale, yScale, 'other-90')
        makeLabel(others90, it, x, y, colorSet90[i], 'other-90', false)
        x += 100;
        if (x > 800) {
            x = 10;
            y += 30;
        }
    }); 


}


main();