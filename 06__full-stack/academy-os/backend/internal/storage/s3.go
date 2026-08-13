package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/ShaharyarShakir/academy-os/internal/config"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/smithy-go"
)

type Service struct {
	client  *s3.Client
	presign *s3.PresignClient
	bucket  string
}

func NewS3(ctx context.Context, cfg config.S3Config) (*Service, error) {
	if cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" {
		return nil, fmt.Errorf("S3 credentials are not configured")
	}

	client := s3.New(s3.Options{
		Region:       cfg.Region,
		BaseEndpoint: aws.String(cfg.Endpoint),
		Credentials: credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		),
		UsePathStyle: true,
	})

	return &Service{
		client:  client,
		presign: s3.NewPresignClient(client),
		bucket:  "academy-videos",
	}, nil
}

func (s *Service) Exists(
	ctx context.Context,
	objectKey string,
) (bool, error) {
	_, err := s.client.HeadObject(
		ctx,
		&s3.HeadObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(objectKey),
		},
	)

	if err != nil {
		var notFound *types.NotFound
		if errors.As(err, &notFound) {
			return false, nil
		}

		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			switch apiErr.ErrorCode() {
			case "NotFound", "NoSuchKey", "404":
				return false, nil
			}
		}

		return false, fmt.Errorf("check object: %w", err)
	}

	return true, nil
}

func (s *Service) PresignUpload(
	ctx context.Context,
	objectKey string,
	contentType string,
) (string, error) {
	request, err := s.presign.PresignPutObject(
		ctx,
		&s3.PutObjectInput{
			Bucket:      aws.String(s.bucket),
			Key:         aws.String(objectKey),
			ContentType: aws.String(contentType),
		},
		func(options *s3.PresignOptions) {
			options.Expires = 15 * time.Minute
		},
	)

	if err != nil {
		return "", fmt.Errorf("presign upload: %w", err)
	}

	return request.URL, nil
}

func (s *Service) Get(
	ctx context.Context,
	objectKey string,
	writer io.Writer,
) error {
	result, err := s.client.GetObject(
		ctx,
		&s3.GetObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(objectKey),
		},
	)
	if err != nil {
		return fmt.Errorf("get object: %w", err)
	}
	defer result.Body.Close()

	if _, err := io.Copy(writer, result.Body); err != nil {
		return fmt.Errorf("read object body: %w", err)
	}

	return nil
}


func (s *Service) Download(
	ctx context.Context,
	objectKey string,
	destination string,
) error {
	result, err := s.client.GetObject(
		ctx,
		&s3.GetObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(objectKey),
		},
	)
	if err != nil {
		return fmt.Errorf("get object: %w", err)
	}
	defer result.Body.Close()

	file, err := os.Create(destination)
	if err != nil {
		return fmt.Errorf("create destination file: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, result.Body); err != nil {
		return fmt.Errorf("download object: %w", err)
	}

	return nil
}

func (s *Service) UploadFile(
	ctx context.Context,
	objectKey string,
	filePath string,
	contentType string,
) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer file.Close()

	_, err = s.client.PutObject(
		ctx,
		&s3.PutObjectInput{
			Bucket:      aws.String(s.bucket),
			Key:         aws.String(objectKey),
			Body:        file,
			ContentType: aws.String(contentType),
		},
	)

	if err != nil {
		return fmt.Errorf("upload object: %w", err)
	}

	return nil
}

func TestConnection(ctx context.Context, s *Service) error {
	_, err := s.client.ListBuckets(ctx, &s3.ListBucketsInput{})
	if err != nil {
		return fmt.Errorf("list S3 buckets: %w", err)
	}

	return nil
}

func (s *Service) PresignDownload(
	ctx context.Context,
	key string,
) (string, error) {
	request, err := s.presign.PresignGetObject(
		ctx,
		&s3.GetObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(key),
		},
		func(options *s3.PresignOptions) {
			options.Expires = 1 * time.Hour
		},
	)

	if err != nil {
		return "", fmt.Errorf("presign download: %w", err)
	}

	return request.URL, nil
}

func (s *Service) Put(
	ctx context.Context,
	key string,
	reader io.Reader,
	contentType string,
) error {
	data, err := io.ReadAll(reader)
	if err != nil {
		return fmt.Errorf("read payload stream: %w", err)
	}

	input := &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          bytes.NewReader(data),
		ContentLength: aws.Int64(int64(len(data))),
	}
	if contentType != "" {
		input.ContentType = aws.String(contentType)
	}

	_, err = s.client.PutObject(ctx, input)
	if err != nil {
		return fmt.Errorf("put object: %w", err)
	}

	return nil
}

func (s *Service) Delete(
	ctx context.Context,
	key string,
) error {
	_, err := s.client.DeleteObject(
		ctx,
		&s3.DeleteObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(key),
		},
	)

	if err != nil {
		return fmt.Errorf("delete object: %w", err)
	}

	return nil
}