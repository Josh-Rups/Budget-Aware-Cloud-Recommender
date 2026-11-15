
resource "aws_lambda_function" "backend" {
  function_name = "archrecommender-api"

  filename = "${path.module}/../build/archrecommender-lambda.zip"

  source_code_hash = filebase64sha256(
    "${path.module}/../build/archrecommender-lambda.zip"
  )

  role    = aws_iam_role.lambda_role.arn
  handler = "backend.main.handler"
  runtime = "python3.12"

  architectures = ["x86_64"]
  memory_size   = 512
  timeout       = 60

  environment {
    variables = {
      AWS_BEDROCK_REGION = "us-east-1"
    }
  }
}
