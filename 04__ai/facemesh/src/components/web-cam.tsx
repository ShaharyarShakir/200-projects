import { useEffect, useRef } from 'react'
import Webcam from 'react-webcam'

import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-converter'

import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { drawMesh } from '../utils/draw-mesh'

export default function WebCam() {
    const webcamRef = useRef<Webcam>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const detect = async (
        detector: faceLandmarksDetection.FaceLandmarksDetector
    ) => {
        if (
            webcamRef.current &&
            webcamRef.current.video &&
            webcamRef.current.video.readyState === 4
        ) {
            const video = webcamRef.current.video

            const videoWidth = video.videoWidth
            const videoHeight = video.videoHeight

            video.width = videoWidth
            video.height = videoHeight

            if (canvasRef.current) {
                canvasRef.current.width = videoWidth
                canvasRef.current.height = videoHeight
            }

            const faces = await detector.estimateFaces(video)

            console.log(faces[0])
            const ctx = canvasRef.current?.getContext('2d') ?? null
            drawMesh(faces, ctx)
        }
    }

    useEffect(() => {
        let interval: number

        const runFaceMesh = async () => {
            await tf.setBackend('webgl')
            await tf.ready()

            const model =
                faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh

            const detector =
                await faceLandmarksDetection.createDetector(model, {
                    runtime: 'tfjs',
                    refineLandmarks: true,
                })

            interval = window.setInterval(() => {
                detect(detector)
            }, 100)
        }

        runFaceMesh()

        return () => clearInterval(interval)
    }, [])

    return (
        <div>
            <Webcam
                ref={webcamRef}
                className="right-0 left-0 absolute mx-auto"
            />

            <canvas
                ref={canvasRef}
                className="right-0 left-0 absolute mx-auto"
            />
        </div>
    )
}