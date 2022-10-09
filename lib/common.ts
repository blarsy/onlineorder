import { ethers } from "ethers";

export interface ConnectionData {
    walletAddress: string,
    signer: ethers.providers.JsonRpcSigner | null
}

export interface ProductData {
    name: string, 
    category: string,
    quantity: number, 
    price: number, 
    unit: string,
    quantityPerSmallCrate?: number,
    quantityPerBigCrate?: number
}

export interface CustomerData {
    title: string,
    email: string,
    mobileNumber: string,
    slug: string,
    customerName: string
}

export interface SalesCycle {
    products: ProductData[],
    customers: CustomerData[],
    weekNumber: number
}

interface Date {
    getWeek(): number,
    addDays(days: number): Date,
    getWeekBounds(): Date[]
}

Date.prototype.getWeek = function(): number {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7);
  }
  Date.prototype.addDays = function (days: number) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }
  
  Date.prototype.getWeekBounds = function() {
    const todayMidnight = new Date(this)
    todayMidnight.setHours(0,0,0,0)
    let i = 0
    while(todayMidnight.addDays(i).getDay() != 1){
      i--
    }
    const beginWeek = todayMidnight.addDays(i).toLocaleDateString('fr-BE')
    i = 0
    while(todayMidnight.addDays(i).getDay() != 0){
      i++
    }
    return [beginWeek, todayMidnight.addDays(i).toLocaleDateString('fr-BE')]
  }

  export const isCurrentOrNextWeekNumber = (weekNumber : number):boolean => {
    const now = new Date()
    const currentWeekNum = now.getWeek()
    if(currentWeekNum == new Date(now.getFullYear(), 11, 31).getWeek()) {
        if(weekNumber != currentWeekNum && weekNumber != 1) {
            return false
        }
    } else {
        if(weekNumber != currentWeekNum && weekNumber != currentWeekNum + 1) {
            return false
        }
    }
    return true
  }