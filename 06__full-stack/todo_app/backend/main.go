package main

import (
	"fmt"

	"github.com/gofiber/fiber/v3"
)

type Todo struct {
	ID        int    `json:"id"`
	Completed bool   `json:"completed"`
	Body      string `json:"body"`
}

func main() {
	fmt.Println("Hello Golang")
	app := fiber.New()
	todos := []Todo{}
	app.Get("/", func(c fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{"message": "Hello World"})
	})

	app.Post("/api/todos", func(c fiber.Ctx) error {
		todo := &Todo{}
		if err := c.Bind().Body(todo); err != nil {
			return err
		}
		if todo.Body == "" {
			c.Status(400).JSON(fiber.Map{"error": "Todo body not found"})
		}
		todo.ID = len(todos) + 1
		todos = append(todos, *todo)

		return c.Status(201).JSON(todo)
	})

	app.Listen(":3000")
}
