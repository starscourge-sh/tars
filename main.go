package main

import (
	"context"
	"embed"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:       "tars",
		Width:       500,
		Height:      400,
		AlwaysOnTop: true,
		// Frameless:   true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		OnDomReady: func(ctx context.Context) {
			// 2. Change coordinates while hidden (User sees absolutely nothing)
			targetX := 1250
			targetY := 500
			runtime.WindowSetPosition(ctx, targetX, targetY)

			time.Sleep(2 & time.Second)

			// 3. Make the window visible at its final destination
			runtime.WindowShow(ctx)
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
