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

const colorMaps = {

};

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


    colorMaps[text] = color;

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
        .attr('class', `${platform} area`)
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
        '#42dee1',
        '#6decb9',
        '#29a19c',
        '#9be3de',
        '#ee4540',
        '#2c7873',
        '#2e279d',
        '#8b2f97',
        '#9fdfcd',
        '#baabda',
        '#39375b',
        '#745c97',
        '#de6b35',
        '#851de0'
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

    let selectYears = years.filter((it) => parseInt(it) <= 1996);
    let selectData = salesData.filter((it) => it.year.getFullYear() <= 1996);
    let allPlatforms = getAllplatforms(selectData);
    let platformData = makeYear2salesPlatform(allPlatforms, selectData, selectYears);

    console.log(rawData.filter((it) => it.yearOfRelease === '1989' ))

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


    const atariClip = makeClip('atari', viz);
    const nesClip = makeClip('nes', viz);
    const other90Clip = makeClip('other-90', viz);
    const opacityScale = d3.scaleLinear().domain([0, window.innerHeight]).range([0, 1]);
    const yearScale = d3.scaleLinear().domain([0, window.innerHeight]).range([1995, 2004]);
    let isScaled = false;
        
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
                const nesScale = d3.scaleLinear().domain([0, window.innerHeight]).range([ xScale(yearParser('1982')), xScale(yearParser('1997'))]);
                nesClip.attr("width", nesScale(column.scrollTop % window.innerHeight));
                let op = opacityScale(column.scrollTop % window.innerHeight);
                d3.select('#label-nes').style('opacity', op);
                d3.select('#label-snes').style('opacity', op);
                d3.select('#label-gb').style('opacity', op);
                break;
            case 3:
                const other90Scale = d3.scaleLinear().domain([0, window.innerHeight]).range([ xScale(yearParser('1987')), xScale(yearParser('1997'))]);
                other90Clip.attr("width", other90Scale(column.scrollTop % window.innerHeight));
                let op = opacityScale(column.scrollTop % window.innerHeight);
                d3.select('#label-other-90').style('opacity', op);
                break;
            case 4:
                // if (!isScaled) {
                //     const tempData = salesData.filter((it) => it.year.getFullYear() >= 1995 && it.year.getFullYear() <= 2005);
                //     allPlatforms = getAllplatforms(tempData);
                //     platformData = makeYear2salesPlatform(allPlatforms, tempData, years.filter((it) => parseInt(it) > 1995 && parseInt(it) <= 2005));
                //     isScaled = true;
                // }
                // const temp = [...selectData];
                // selectData = salesData.filter((it) => it.year.getFullYear() <= yearScale(column.scrollTop % window.innerHeight));
                // xScale.domain(d3.extent(selectData, (d) => d.year));
                // yScale.domain([0, d3.max(selectData, (d) => d.sales)]);
                // viz
                //     .select('.xaxisgroup')
                //     .call(xAxis);
        
                //     viz.select('.yaxisgroup')
                //             .call(yAxis)
                //     viz.selectAll('.line').attr('d', lineMaker(temp))
                //     let tempyS = new Array(50).fill(0);
                //     viz.selectAll('.area').remove()

                //     const allPlatforms = getAllplatforms(selectData);
                //     const selectYears = years.filter((it) => parseInt(it) <=  yearScale(column.scrollTop % window.innerHeight));
                //     const platformData = makeYear2salesPlatform(allPlatforms, selectData, selectYears);
                //     viz.selectAll('.area').data(platformData)
                //                         .enter()
                //                         .append('path')
                //                         .style('fill', colorSet20[0])
                //                         .attr('d', (d, i) => {
                //                             return d3.area()
                //                                 .x((n) => {
                //                                     console.log(i)
                //                                     return xScale(n.year)
                //                                 })
                //                                 .y0((n, i) => {
                //                                     return yScale(tempyS[i])
                //                                 })
                //                                 .y1((n, i) => {
                //                                     tempyS[i] += n.sales;
                //                                     return yScale(tempyS[i])
                //                                 })(d)
                //                         })
                //                         .exit().remove();

                //     viz.selectAll('.dots').style('opacity', 1 - opacityScale(column.scrollTop  % window.innerHeight) -.2)

                break;

            default:
                console.log(pageNum)
        }
    });

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
        .attr('class', 'atari area')
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
    makeArea("GB", ys, '#3fc5f0', viz, platformData, xScale, yScale, 'nes');
    makeLabel(labels, 'GB', 310, 10, '#3fc5f0', 'label-GB');
    let x = 390;
    let y = 10;
    const others90 = labels.append('g').attr('id', 'label-other-90').style('opacity', 0);
    platformData.map(
        (it) => it[0].platform
    ).filter((it) => it !== '2600' && it !== 'NES' && it !== 'SNES' && it !== 'GB')
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