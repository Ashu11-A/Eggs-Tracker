import { EggMap } from "@/types/EggMapping"
import { EggConfig } from "@/types/EggType"
import { readFileSync, statSync, writeFile } from "fs"
import { formatBytes } from "./format"
import cld from 'cld'

export async function genMap(eggs: string[], branch: string, repository: string) {
    const EggsMapping: EggMap[] = []

    for (const egg of eggs) {
        const file = readFileSync(egg, 'utf8')
        const { size } = statSync(egg)
        const { name, description, author, exported_at } = JSON.parse(file) as EggConfig
        const link = `https://raw.githubusercontent.com/${repository}/${branch}/${egg.replace(`${egg.split('/')[0]}/`, '')}`
        const language = await cld.detect(description)
            .then(({ languages }) => {
                return languages.reduce((max, language) => language.percent >  max.percent ?? 0 ? language : max).code
            })
            .catch((err: Error) => {
                console.log({
                    error: err.message,
                    egg: egg.split('/').pop(),
                    link,
                    description,
                })
                return 'en'
            })

        EggsMapping.push({
            author,
            name,
            description,
            exported_at,
            link,
            size: formatBytes(size),
            language
        })
    }

    writeFile(`api/${repository.split('/')[0]}.min.json`, JSON.stringify(EggsMapping), {}, ((err) => {
        if (err) console.log('Ocorreu um erro ao salvar os Dados:', err)
    }))
    writeFile(`api/${repository.split('/')[0]}.json`, JSON.stringify(EggsMapping, null, 2), {}, ((err) => {
        if (err) console.log('Ocorreu um erro ao salvar os Dados:', err)
    }))
}
