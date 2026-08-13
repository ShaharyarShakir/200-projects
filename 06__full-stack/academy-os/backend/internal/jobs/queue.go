package jobs

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
)

const (
	VideoProcessingQueue = "academy:jobs:video-processing"
	JobVideoProcess      = "video.process"
)

type Job struct {
	Type string `json:"type"`
	Data []byte `json:"data"`
}

type Queue interface {
	Enqueue(
		ctx context.Context,
		job Job,
	) error

	Consume(
		ctx context.Context,
	) (Job, error)
}

type RedisQueue struct {
	redis *redis.Client
}

func NewQueue(redis *redis.Client) *RedisQueue {
	return &RedisQueue{
		redis: redis,
	}
}

func (q *RedisQueue) Enqueue(
	ctx context.Context,
	job Job,
) error {
	payload, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("marshal job: %w", err)
	}

	if err := q.redis.LPush(
		ctx,
		VideoProcessingQueue,
		payload,
	).Err(); err != nil {
		return fmt.Errorf("enqueue job: %w", err)
	}

	return nil
}

func (q *RedisQueue) Consume(
	ctx context.Context,
) (Job, error) {
	result, err := q.redis.BRPop(ctx, 0, VideoProcessingQueue).Result()
	if err != nil {
		return Job{}, fmt.Errorf("pop job: %w", err)
	}

	if len(result) < 2 {
		return Job{}, fmt.Errorf("invalid pop result length")
	}

	var job Job
	if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
		// If payload was not wrapped in Job struct, try unmarshaling directly into a Job with Type JobVideoProcess
		job = Job{
			Type: JobVideoProcess,
			Data: []byte(result[1]),
		}
	}

	return job, nil
}

func (q *RedisQueue) EnqueueVideoProcessing(
	ctx context.Context,
	job VideoProcessingJob,
) error {
	payload, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("marshal job: %w", err)
	}

	if err := q.redis.LPush(
		ctx,
		VideoProcessingQueue,
		payload,
	).Err(); err != nil {
		return fmt.Errorf("enqueue job: %w", err)
	}

	return nil
}

