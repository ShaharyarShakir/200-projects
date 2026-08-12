package jobs

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
)

const VideoProcessingQueue = "academy:jobs:video-processing"

type Queue struct {
	redis *redis.Client
}

func NewQueue(redis *redis.Client) *Queue {
	return &Queue{
		redis: redis,
	}
}

func (q *Queue) EnqueueVideoProcessing(
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
