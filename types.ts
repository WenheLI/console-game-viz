export interface VideoGame {
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

export interface SalesData {
    year: Date,
    sales: number,
    platformSales: {}
}