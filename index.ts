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

const sum = (arr: Array<number>): number => {
    return arr.reduce((prev, curr) => {
        return prev + curr;
    }, 0);
}

const main = async () => {
    const w = 1200;
    const h = 800;
    const padding = 90
    const viz = d3.select('#container').append('svg')
                    .style('width', w)
                    .style('height', h)

    let data = await d3.csv('./videogames.csv');
    console.log(data)
    data = data.filter((it) => it['yearOfRelease'] !== 'N/A')
                .filter((it) => it['yearOfRelease'] !== '2017')
                .filter((it) => it['yearOfRelease'] !== '2020');
    const gameData: VideoGame = data.map((it) => {
        it['yearOfRelease'] = d3.timeParse('%y')(it.yearOfRelease)
    })
}

main();