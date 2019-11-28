import {SalesData, VideoGame} from './types';
import * as d3 from 'd3';

const sum = (arr: Array < number > ): number => {
    return arr.reduce((prev, curr) => {
        return prev + curr;
    }, 0);
}

const promizer = (func) => {
    return new Promise((resolve) => {
        func().on('end', resolve);
    });
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

export {
    makeYear2salesPlatform,
    sum,
    promizer,
    processData,
    getYearSales,
    getAllplatforms
}