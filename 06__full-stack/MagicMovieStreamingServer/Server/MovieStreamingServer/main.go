package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
)


func main()  {
	router := gin.Default()
	router.GET("/movies", func (c *gin.Context)  {
		c.String(200, "Hello from the Movie Streaming Server!")
	})
	if err := router.Run(":8080"); err != nil {
		fmt.Printf("Failed to start server: %v\n", err)
	}
}
