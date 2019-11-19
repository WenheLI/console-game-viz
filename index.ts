import * as d3 from "d3";

const sum = (arr: Array<number>): number => {
    return arr.reduce((prev, curr) => {
        return prev + curr;
    }, 0);
}

const main = async () => {
    const w = 1200;
    const h = 800;
    const padding = 90
    const data = await d3.csv('./videogames.csv');
    console.log(data);
}

main();