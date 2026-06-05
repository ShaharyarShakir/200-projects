import type { Ctx, Keypoint } from "../types/keys"

const drawPath = (
    ctx: Ctx,
    points: Keypoint[],
    closePath: boolean
) => {
    if (!ctx || points.length === 0) return

    const region = new Path2D()

    region.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length; i++) {
        region.lineTo(points[i].x, points[i].y)
    }

    if (closePath) {
        region.closePath()
    }

    ctx.stroke(region)
}

export const drawMesh = (
    predictions: any[],
    ctx: Ctx
) => {
    if (!ctx || !predictions || predictions.length === 0) return

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    predictions.forEach((prediction) => {
        const keypoints: Keypoint[] = prediction.keypoints

        if (!keypoints || keypoints.length === 0) return

        // Draw triangulated face mesh
        keypoints.forEach((point) => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI)
            ctx.fillStyle = 'aqua'
            ctx.fill()
        })
    })
}