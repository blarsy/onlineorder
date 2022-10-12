export const getWeek = function(date: Date): number {
    var date = new Date(date.getTime())
    date.setHours(0, 0, 0, 0)
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4)
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7)
  }
  export const addDays = function (refDate:Date, days: number): Date {
    let date = new Date(refDate.valueOf())
    date.setDate(date.getDate() + days)
    return date
  }
  
  export const getWeekBounds = function(date: Date): Date[] {
    const todayMidnight = new Date(date)
    todayMidnight.setHours(0,0,0,0)
    let i = 0
    while(addDays(todayMidnight,i).getDay() != 1){
      i--
    }
    const beginWeek = addDays(todayMidnight,i)
    i = 0
    while(addDays(todayMidnight,i).getDay() != 0){
      i++
    }
    return [beginWeek, addDays(todayMidnight,i)]
  }

  export const isCurrentOrNextWeekNumber = (weekNumber : number):boolean => {
    const now = new Date()
    const currentWeekNum = getWeek(now)
    if(currentWeekNum == getWeek(new Date(now.getFullYear(), 11, 31))) {
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

export const getDateOfISOWeek = (w: number, y: number): Date => {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}