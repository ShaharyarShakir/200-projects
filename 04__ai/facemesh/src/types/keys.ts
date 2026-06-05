export type Keypoint = {
    x: number
    y: number
    z?: number
    name?: string
}

export type Ctx = CanvasRenderingContext2D | null