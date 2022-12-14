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

export const addWorkingDays = function (refDate:Date, days: number): Date {
  let date = new Date(refDate.valueOf())
  for(let i = 0; i < days; i ++) {
    if(date.getDay() === 5) {
      date.setDate(date.getDate() + 3)
    } else {
      date.setDate(date.getDate() + 1)
    }
  }
  return date
}

export const findNextWeekdayTime = (weekday: number, hour: number) => {
  const now = new Date()
  let refDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  while(refDate.getDay() != weekday){
      refDate = new Date(1000 * 60 * 60 * 24 + refDate.valueOf())
  }
  return new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), hour, 0, 0)
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