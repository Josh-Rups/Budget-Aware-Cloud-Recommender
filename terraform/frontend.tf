
# Private S3 bucket for ArchRecommender frontend
resource "aws_s3_bucket" "frontend" {
  bucket_prefix = "archrecommender-frontend-"
}

# Block public access to the bucket
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront access to private S3
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "archrecommender-oac"
  description                       = "Private S3 access for ArchRecommender"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "ArchRecommender website"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "archrecommender-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "archrecommender-s3"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 300
    max_ttl     = 3600
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Allow CloudFront to read S3 objects
data "aws_iam_policy_document" "frontend" {
  statement {
    actions = ["s3:GetObject"]

    resources = [
      "${aws_s3_bucket.frontend.arn}/*"
    ]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"

      values = [
        aws_cloudfront_distribution.frontend.arn
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend.json

  depends_on = [
    aws_s3_bucket_public_access_block.frontend
  ]
}

# Upload frontend files
resource "aws_s3_object" "frontend_files" {
  for_each = {
    "index.html" = "text/html"
    "style.css"  = "text/css"
    "script.js"  = "application/javascript"
  }

  bucket       = aws_s3_bucket.frontend.id
  key          = each.key
  source       = "${path.module}/../frontend/${each.key}"
  content_type = each.value
  etag         = filemd5("${path.module}/../frontend/${each.key}")
}
