import { errorToString, TaskLogEntry, TaskStatus } from "../common"

class Task {
    constructor(args: any[], workerFn: (args: any[]) => Promise<void>, name: string) {
        this.args = args
        this.name = name
        this.workerFn = workerFn
        this.log = [{ date: new Date(), status: TaskStatus.created, name }]
    }
    args: any[]
    name: string
    log: TaskLogEntry[]
    workerFn: (args: any[]) => Promise<void>
    execute = async (): Promise<any> => {
        try {
            this.log.push({ date: new Date(), status: TaskStatus.executing, name: this.name })
            await this.workerFn(this.args)
            this.log.push({ date: new Date(), status: TaskStatus.finished, name: this.name })
            return null
        } catch (e: any) {
            this.log.push({ date: new Date(), status: TaskStatus.finished, name: this.name, error: errorToString(e) })
        }
    }
    lastLog = (): TaskLogEntry => this.log[this.log.length - 1]
}

export default Task