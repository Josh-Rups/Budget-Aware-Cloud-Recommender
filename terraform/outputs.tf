
output "api_url" {
  description = "Public API URL for ArchRecommender"
  value       = aws_apigatewayv2_api.api.api_endpoint
}



output "website_url" {
  description = "Public ArchRecommender website URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "frontend_bucket_name" {
  description = "Private S3 bucket for the frontend"
  value       = aws_s3_bucket.frontend.id
}
