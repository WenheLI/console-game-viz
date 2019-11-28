import * as d3 from 'd3';
const w = window.innerWidth * .7;
const h = window.innerHeight;
const padding = 90;

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
    sales: number,
    platformSales: {}
}

const yearRange = [1995, 2010, 2016];
let cursor = 0;
let xScale;
let xAxis;
let yScale;
let yAxis;
let lineMaker: d3.Line<Array<Array<SalesData>>>;
let salesData: Array<SalesData> = [];
let selectData: Array<SalesData> = [];

const sum = (arr: Array < number > ): number => {
    return arr.reduce((prev, curr) => {
        return prev + curr;
    }, 0);
}

const type = (content: string, speed: number) => {

}

const promizer = (func) => {
    return new Promise((resolve) => {
        func().on('end', resolve);
    });
}

const hookButtons = (viz: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>) => {
    const atarri = document.getElementById('shock');
    const nextButton = document.getElementById('next-button-img');
    const displayDiv = document.getElementById('display');
    const statsButton = document.getElementById('stats-button-img');
    const statsBackButton = document.getElementById('back-to-phases');

    const moerButton = document.getElementById('to-2');

    const textArea = document.getElementById('text');

    moerButton.addEventListener('click', () => {
        const temp = [...selectData];
        selectData = salesData.filter((it) => it.year.getFullYear() < yearRange[1]);
        xScale.domain(d3.extent(selectData, (d) => d.year));
        yScale.domain([0, d3.max(selectData, (d) => d.sales)]);

        const xAnimate = promizer(() => {
                return viz.transition()
                        .select('.xaxisgroup')
                        .duration(2000)
                        .call(xAxis);
        });

        const yAnimate = promizer(() => {
            return viz.transition()
                    .select('.yaxisgroup')
                    .duration(2000)
                    .call(yAxis)
        });
        textArea.scrollTo({
            top: window.innerHeight,
            behavior: "smooth"
        })
        Promise.all([xAnimate, yAnimate]).then(() => {
            viz.transition()
            .selectAll('.line')
            .duration(2000)
            .attr('d', lineMaker(temp))
        });



    });

    statsBackButton.addEventListener('click', (e) => {
        scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        })
    });

    statsButton.addEventListener('click', () => {
        scrollTo({
            top: window.innerHeight * 2,
            behavior: 'smooth'
        })
    })

    atarri.addEventListener('click', (e) => {
        document.getElementsByClassName('shader')[0].className = 'shader show';
    });

    // document.getElementById('atari-close').addEventListener('click', () => {
    //     document.getElementsByClassName('shader')[0].className = 'shader hide';

    // })


    // nextButton.addEventListener('click', (e) => {
    //     scrollTo({
    //         top: window.innerHeight,
    //         behavior: 'smooth'
    //     })
    // });

}

const processData = async () => {
    const rawData = await d3.csv('./videogames.csv');
    const data: Array < VideoGame > =
        rawData.filter((it) => it['yearOfRelease'] !== 'N/A').map((it) => {
            const d: VideoGame = {} as VideoGame;
            const strings = ["name", "platform", "publisher", "developer", "rating", "genre"];
            strings.forEach((name) => {
                d[name] = it[name];
            });
            const floats = [
                "EUSales", "JPSales", "NASales", "OtherSales", "GlobalSales", "criticScore", "userScore", "userCount", "criticCount"
            ]
            d.yearOfRelease = d3.timeParse('%Y')(it.yearOfRelease);
            floats.forEach((float) => {
                const temp = parseFloat(it[float]);
                if (!isNaN(temp)) d[float] = temp;
                else d[float] = -1;
            })
            return d;
        });
    
    return {
        rawData,
        data
    };
}

const getYearSales = (years: Array < string > , data: Array < VideoGame > ) => {
    return years.map((year) => {
        const currYears = d3.timeParse('%Y')(year).getFullYear();
        const platforms = Array.from(new Set(data.filter((it) =>
                it.yearOfRelease.getFullYear() === currYears)
            .map(it => it.platform)));
        const platformSales = {};
        platforms.forEach((it) => {
            const sumSales = sum(
                data.filter((game) => game.yearOfRelease.getFullYear() === currYears)
                    .filter((game) => game.platform === it).map(it => it.GlobalSales)
            );
           platformSales[it] = sumSales;
        })
        return {
            year: d3.timeParse('%Y')(year),
            sales: sum(
                data.filter((it) => it.yearOfRelease.getFullYear() === currYears)
                .map((it) => it.GlobalSales)
            ),
            platformSales
        } as SalesData
    }).sort((a, b) => {
        if (a.year < b.year) return -1
        else return 1;
    });
}

const getValueFromObject = (obj: object) => {
    return Object.keys(obj).map((it) => obj[it]);
}

const typeWords = (target: HTMLElement, words: string, speed: number) => {
    const length = words.length;
    let i = 0;
    return new Promise((resolve, reject) => {
        const id = setInterval(() => {
            target.innerText += words.charAt(i);
            i += 1;
            if (i === length - 1) {
                clearInterval(id);
                return resolve;
            }
        }, speed);
    });
  
}

const animateLine = (time: number, target: d3.Selection<d3.BaseType, unknown, HTMLElement, any> | d3.BaseType, ease=d3.easeQuad) => {
    let _target = target;
    if (!target.node) {
        _target = d3.select(target)
    } 
    let length = _target.node().getTotalLength();
    
    return new Promise((resolve, reject) => {
        _target.attr("stroke-dasharray", length + " " + length)
            .attr("stroke-dashoffset", length)
            .transition()
            .ease(ease)
            .duration(8000) 
            .attr("stroke-dashoffset", 0)
            .on('end', () => resolve());
    });
}

const showText = (target: HTMLElement, time: number) => {
    return new Promise((resolve) => {
        target.animate([
            {
                opacity: 0
            },
            {
                opacity: 1
            }
        ], {
            duration: 1000,
            fill: 'both'
        }).addEventListener('finish', () => {
            resolve();
        })
    });
}

const getAllplatforms = (data: Array<SalesData>) => {
    return Array.from(new Set(data.map(it => Object.keys(it.platformSales)).flat(2))) as Array<string>;
}

const makeYear2salesPlatform = (platforms: Array<string>, data: Array<SalesData>, years: Array<string>) => {
    return platforms.map((platform) => {
        return years.map((year) => {
            const currentYearSales = data.filter((it) => it.year.getFullYear() === d3.timeParse('%Y')(year).getFullYear())[0].platformSales[platform];
            // console.log(currentYearSales, platform, currentYearSales[platform])
            // console.log(currentYearSales, platform)
            return {
                year: d3.timeParse('%Y')(year),
                sales: currentYearSales ? currentYearSales : 0,
                platform
            }
        })
    });
}

const main = async () => {

    const viz = d3.select('#container').append('svg')
        .style('width', w)
        .style('height', h)
        .style('background', 'aliceblue');

    hookButtons(viz);


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

    salesData = getYearSales(years, data);
    
    let selectYears = years.filter((it) => parseInt(it) <= 1995)
    selectData = salesData.filter((it) => it.year.getFullYear() <= 1995)
    let yMax = d3.max(selectData, (d) => d.sales);

    let xDomain = d3.extent(selectData, (d) => d.year);
    let yDomain = [0, yMax];

    xScale = d3.scaleTime().domain(xDomain).range([padding, w - padding]);
    xAxis = d3.axisBottom(xScale);
    const  xAxisGroup = viz.append("g")
                        .attr("class", "xaxisgroup")
                        .style('font-family', `'Press Start 2P', cursive`)
                        .attr("transform", "translate(0," + (h - padding) + ")");
    xAxisGroup.call(xAxis);

    yScale = d3.scaleLinear().domain(yDomain).range([h - padding, padding]);
    yAxis = d3.axisLeft(yScale);
    const  yAxisGroup = viz.append("g")
                        .attr("class", "yaxisgroup")
                        .style('font-family', `'Press Start 2P', cursive`)
                        .attr("transform", "translate(" + (padding / 2) + ",0)");
    yAxisGroup.call(yAxis);
    lineMaker = d3.line()
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

    // const globalLine = d3.select('.global');

    const phase1s = document.querySelectorAll('#phase-1 .transparent');

    let allPlatforms = getAllplatforms(selectData);
    const t = makeYear2salesPlatform(allPlatforms, selectData, selectYears);
    //await
    await animateLine(5000, globalLine);
    const colorScale = d3.scaleOrdinal().domain(allPlatforms)
                            .range(allPlatforms.map((val, i) => 
                                    d3.interpolateRainbow(i / (allPlatforms.length ))
                            ));

    viz.selectAll(".atari").data(t.filter((it) => it[0].platform === '2600')).enter()
                .append("path")
                .attr('class', 'line atari')
                .attr("d", lineMaker)
                .attr('stroke', (d) => colorScale(d[0].platform))
                .attr('stroke-width', '3px')
                .style('fill', 'none')
                .style('opacity', 1);

    const atari = d3.select('.atari');
    
    await Promise.all([showText(phase1s[0], 500), animateLine(300, atari)]);
    
    viz.selectAll(".nes").data(t.filter((it) => it[0].platform === "NES" )).enter()
        .append("path")
        .attr('class', 'line nes')
        .attr("d", lineMaker)
        .attr('stroke', (d) => colorScale(d[0].platform))
        .attr('stroke-width', '3px')
        .style('fill', 'none')
        .style('opacity', 1);
    viz.selectAll(".snes").data(t.filter((it) => it[0].platform === "SNES" )).enter()
        .append("path")
        .attr('class', 'line snes')
        .attr("d", lineMaker)
        .attr('stroke', (d) => colorScale(d[0].platform))
        .attr('stroke-width', '3px')
        .style('fill', 'none')
        .style('opacity', 1);    

    let anis = [
        showText(phase1s[1], 500),
        animateLine(3000, d3.select('.snes'), d3.easeQuadOut),
        animateLine(3000, d3.select('.nes'), d3.easeQuadOut),
    ]

    await Promise.all(anis);

    showText(phase1s[2], 500);
    viz.selectAll(".others").data(t.filter((it) => 
                it[0].platform !== "NES" &&
                it[0].platform !== "SNES" &&
                it[0].platform !== "2600"
            )).enter()
        .append("path")
        .attr('class', 'others line')
        .attr("d", lineMaker)
        .attr('stroke', (d) => colorScale(d[0].platform))
        .attr('stroke-width', '3px')
        .style('fill', 'none')
        .style('opacity', 1);
    const others = d3.selectAll('.others');
    await Promise.all(others.nodes().map((it) => {
        animateLine(3000, it);
    }));
    
    showText(phase1s[3], 300);

}

main();