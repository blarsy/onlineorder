import { TaskStatus } from "../common"
import Task from "./task"

class Queue {
    numberOfFinishedTasksKept: number
    tasks: Task[]
    constructor(numberOfFinishedTasksKept: number) {
        this.tasks = []
        this.numberOfFinishedTasksKept = numberOfFinishedTasksKept
    }
    enqueue = (task: Task): void => {
        this.tasks.push(task)

        // remove enough finished tasks to ensure only 'numberOfFinishedTasksKept' of them stay on the queue
        let numberOfFinishedTasks = 0
        this.tasks.forEach(task => {
            const newListOfTasks = []
            if(task.lastLog().status === TaskStatus.finished) {
                if(numberOfFinishedTasks < 5) {
                    numberOfFinishedTasks ++
                    newListOfTasks.push(task)
                }
            } else {
                newListOfTasks.push(task)
            }
        })
        task.execute()
    }
}

const singletonQueue = new Queue(5)

export default singletonQueue