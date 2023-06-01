const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const archiver = require('archiver');
const path = require("path");

const allLangs = ['en', 'vi', 'zh_Hans'];

const getFileName = (file) => file.replace('.json', '')

const wlSyncTranslations = async () => {
  const filesInEn = fs.readdirSync(`${process.cwd()}/en`).filter((file) => !file.includes('DS'));

  for (const [index, file] of filesInEn.entries()) {
    const fileName = getFileName(file)

    const slugifyFileName = fileName.replaceAll('.', '-')

    fs.mkdirSync(path.resolve(__dirname, `./outputs/${slugifyFileName}`), { recursive: true })
    fs.mkdirSync(path.resolve(__dirname, `./archives`), { recursive: true })

    allLangs.forEach((lang, index) => {
      try {
        const content = fs.readFileSync(path.resolve(__dirname, `./${lang}/${fileName}.json`), 'utf8');
        fs.writeFileSync(path.resolve(__dirname, `./outputs/${slugifyFileName}/${lang}.json`), content, 'utf8');
      } catch (error) {
        console.log(error)
      }
    })

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    const output = fs.createWriteStream(path.resolve(__dirname, `./archives/${slugifyFileName}.zip`));
    archive.pipe(output);
    archive.directory(path.resolve(__dirname, `./outputs/${slugifyFileName}`), '');
    await archive.finalize();

    setTimeout(async () => {
      try {
        let data = new FormData();
        const zipFilePath = `/Users/alexpham/Workspace/_genetica/genetica.asia/packages/website/public/locales/archives/${slugifyFileName}.zip`

        // data.append('template', 'en.json');
        data.append('template', `packages/website/public/locales/en/${file}.json`);
        data.append('name', fileName);
        data.append('slug', slugifyFileName);
        data.append('file_format', 'json');
        data.append('new_lang', 'add');
        data.append('repo', 'https://github.com/duy-alex-genetica/test-weblate-sync');
        data.append('branch', 'main');
        // data.append('zipfile', fs.createReadStream(zipFilePath));
        data.append('filemask', `packages/website/public/locales/*/${file}.json`);
        // data.append('filemask', `*/${slugifyFileName}.json`);
        data.append('source_language', 'en');

        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://weblate.transman.admin.genetica.asia/api/projects/genetica-website/components/',
          headers: {
            'Authorization': 'Token wlu_gfXo5HB6KT2BybnUcJj1bMlgDGlPiSzRR5JA',
            ...data.getHeaders()
          },
          data: data
        };
        await axios.request(config);
        console.log("Success")
      } catch (error) {
        console.log(error?.response?.data ?? {})
      }
    }, 50 * index);
  }
}

const wlDeleteAllTranslations = async () => {
  const filesInEn = fs.readdirSync(`${process.cwd()}/en`).filter((file) => !file.includes('DS'));

  for (const [index, file] of filesInEn.entries()) {
    const fileName = getFileName(file)
    const slugifyFileName = fileName.replaceAll('.', '-')

    setTimeout(async () => {
      try {
        let config = {
          method: 'delete',
          url: `https://weblate.transman.admin.genetica.asia/api/components/genetica-website/${slugifyFileName}/`,
          headers: {
            'Authorization': 'Token wlu_gfXo5HB6KT2BybnUcJj1bMlgDGlPiSzRR5JA',
          },
        };
        await axios.request(config);
        console.log("Deleted component:" + slugifyFileName)
      } catch (error) {
        console.log(error?.response?.data ?? {})
      }
    }, 50 * index);
  }
}

wlSyncTranslations();
// wlDeleteAllTranslations();
