import * as d3 from "d3";

interface VideoGame {
    name: string,
    platform: string,
    publisher: string,
    developer: string,
    rating: string,
    genre: string,
    yearOfRelease: Date,
    EUSales: number,
    JPSales: number,
    NASales: number,
    OtherSales: number,
    GlobalSales: number,
    criticScore: number,
    userScore: number,
    userCount: number,
    criticCount: number
}

interface SalesData {
    year: Date,
    sales: number
}

const sum = (arr: Array<number>): number => {
    return arr.reduce((prev, curr) => {
        return prev + curr;
    }, 0);
}

const main = async () => {
    const w = 800;
    const h = 800;
    const padding = 90;

    const textArea = document.getElementById('text');

    const viz = d3.select('#container').append('svg')
                    .style('width', w)
                    .style('height', h)
                    .style('background', 'aliceblue')

    let data = await d3.csv('./videogames.csv');
    textArea.innerHTML = '';
    data = data.filter((it) => it['yearOfRelease'] !== 'N/A')
                .filter((it) => it['yearOfRelease'] !== '2017')
                .filter((it) => it['yearOfRelease'] !== '2020');
    const gameData: Array<VideoGame> = data.map((it) => {
        const d: VideoGame = {} as VideoGame;
        const strings = ["name","platform","publisher","developer","rating","genre"];
        strings.forEach((name) => {
            d[name] = it[name];
        });
        const floats = [
            "EUSales" , "JPSales" , "NASales" , "OtherSales" , "GlobalSales" , "criticScore" , "userScore" , "userCount" , "criticCount"
        ]
        d.yearOfRelease = d3.timeParse('%Y')(it.yearOfRelease);
        floats.forEach((float) => {
            const temp = parseFloat(it[float]);
            if (!isNaN(temp)) d[float] = temp;
            else d[float] = -1;
        })
        return d;
    });

    const years = Array.from(new Set(data.map((it) => it.yearOfRelease)));
    const salesData = years.map((year) => {
        return {
            year: d3.timeParse('%Y')(year),
            sales: sum(
                gameData.filter((it) => it.yearOfRelease.getTime() === d3.timeParse('%Y')(year).getTime())
                .map((it) => it.GlobalSales)    
            )
        }
    }).sort((a, b) => {
        if (a.year < b.year) return 1
        else return -1;
    });

    let xDomain = d3.extent(salesData, function (d) {
        return d.year
    });
    let xScale = d3.scaleTime().domain(xDomain).range([padding, w - padding]);
    let xAxis = d3.axisBottom(xScale);
    let xAxisGroup = viz.append("g")
        .attr("class", "xaxisgroup")
        .attr("transform", "translate(0," + (h - padding) + ")");
    xAxisGroup.call(xAxis);

    let yMax = d3.max(salesData, function (d) {
        return d.sales;
    })
    let yDomain = [0, yMax];
    let yScale = d3.scaleLinear().domain(yDomain).range([h - padding, padding]);
    let yAxis = d3.axisLeft(yScale);
    let yAxisGroup = viz.append("g")
        .attr("class", "yaxisgroup")
        .attr("transform", "translate(" + (padding / 2) + ",0)");
    yAxisGroup.call(yAxis);

    const lineMaker = d3.line()
        .x((d) => {
            return xScale(d.year)
        })
        .y((d) => yScale(d.sales));

    viz.selectAll(".global").data([salesData])
        .enter()
        .append("path")
        .attr('class', 'line global')
        .attr("d", lineMaker)
        .attr('stroke', 'black')
        .attr('stroke-width', '5px')
        .style('fill', 'none');

    viz.selectAll('.point').data(salesData)
        .enter()
        .append('circle')
        .attr('class','point')
        .attr('cx', (d) => xScale(d.year))
        .attr('cy', (d) => yScale(d.sales))
        .attr('r', (d) => 5)
        .style('fill', '#c71585')
        .on('mouseenter', function (d) {
                viz.append('line')
                    .attr('class', 'animatedLine')
                    .style("stroke", "#c71585")
                    .style("stroke-weight", 30)
                    .attr('x1', xScale(d.year))
                    .attr('y1', yScale(d.sales))
                    .attr('x2', xScale(d.year))
                    .attr('y2', yScale(d.sales))
                    .transition()
                    .duration(1000)
                    .attr('y2', yScale(0));
                viz.append('rect')
                    .attr('class', 'selectedArea')
                    .attr('x', xScale(d.year))
                    .attr('y', yScale(yMax))
                    .attr('width', 160)
                    .attr('height', yScale(0))
                    .style('opacity', .5)
                    .style('fill', 'black')
            textArea.innerHTML = '';
            textArea.innerHTML = `<p>This is ${d.year.getFullYear()} </p> <br > <p> The global sales are ${d.sales.toFixed(2)} millions</p> <br >`
                        
            d3.select(this)
                .append('text')
                
            d3.select(this)
             .transition()
             .style('fill', 'orange')
             .attr('r', 10);
        })
        .on('mouseleave', function (d) {
            d3.select(this)
             .transition()
             .style('fill', '#c71585')
             .attr('r', 5);
             textArea.innerHTML = ``;

            viz.selectAll('.selectedArea').remove();

            viz.selectAll('.animatedLine')
                    .transition()
                    .duration(1000)
                    .attr('y2', yScale(d.sales))
                    .remove()
            
        });
}
main();