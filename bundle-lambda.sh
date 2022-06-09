cd lambda
npx esbuild --bundle *.ts --outdir=dist --platform=node --target=node16.0 --format=cjs $@
cd ..
