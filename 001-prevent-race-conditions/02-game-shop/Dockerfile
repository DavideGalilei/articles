FROM python:3.12-alpine

WORKDIR /code

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "worker:app", "--host", "0.0.0.0", "--port", "8000"]
