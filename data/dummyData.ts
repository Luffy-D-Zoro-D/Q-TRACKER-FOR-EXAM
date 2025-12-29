import { FormattedData } from "../types";

export const dummyData: FormattedData = {
    semesters: [
        {
            id: "sem-s25",
            title: "S25",
            questions: [
                {
                    id: "q-1",
                    number: "5",
                    subQuestions: [
                        {
                            id: "sq-1a",
                            label: "(a)",
                            text: "Explain the concept of object-oriented programming with suitable examples.",
                            marks: "8",
                            isDone: false
                        },
                        {
                            id: "sq-1b",
                            label: "(b)",
                            text: "Write a program to implement inheritance in Java.",
                            marks: "7",
                            isDone: false
                        }
                    ]
                },
                {
                    id: "q-2",
                    number: "6",
                    subQuestions: [
                        {
                            id: "sq-2a",
                            label: "(a)",
                            text: "Describe the differences between abstract classes and interfaces.",
                            marks: "8",
                            isDone: false
                        },
                        {
                            id: "sq-2b",
                            label: "(b)",
                            text: "Implement a simple calculator using polymorphism.",
                            marks: "7",
                            isDone: false
                        }
                    ]
                }
            ]
        },
        {
            id: "sem-w24",
            title: "W24",
            questions: [
                {
                    id: "q-3",
                    number: "7",
                    subQuestions: [
                        {
                            id: "sq-3a",
                            label: "(a)",
                            text: "What is exception handling? Explain with try-catch blocks.",
                            marks: "8",
                            isDone: false
                        },
                        {
                            id: "sq-3b",
                            label: "(b)",
                            text: "Write a program to demonstrate custom exception handling.",
                            marks: "7",
                            isDone: false
                        }
                    ]
                },
                {
                    id: "q-4",
                    number: "8",
                    subQuestions: [
                        {
                            id: "sq-4a",
                            label: "(a)",
                            text: "Explain the concept of multithreading in Java.",
                            marks: "8",
                            isDone: false
                        },
                        {
                            id: "sq-4b",
                            label: "(b)",
                            text: "Implement a simple thread synchronization example.",
                            marks: "7",
                            isDone: false
                        }
                    ]
                }
            ]
        }
    ]
};
