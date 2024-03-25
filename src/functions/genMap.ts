import { EggMap } from "@/types/EggMapping"
import { EggConfig } from "@/types/EggType"
import { readFileSync, statSync, writeFile } from "fs"
import { formatBytes } from "./format"
import cld from 'cld'

export async function genMap(eggs: string[]) {
    const EggsMapping: EggMap[] = []

    for (const egg of eggs) {
        const file = readFileSync(egg, 'utf8')
        const { size } = statSync(egg)
        const { name, description, author } = JSON.parse(file) as EggConfig

        EggsMapping.push({
            name,
            description,
            author,
            link: `https://raw.githubusercontent.com/${egg}`,
            size: formatBytes(size),
            language: (await cld.detect(description)).languages.reduce((max, language) => language.percent >  max.percent ?? 0 ? language : max).code
        })
    }

    writeFile('api/eggs.min.json', JSON.stringify(EggsMapping), {}, ((err) => {
        if (err) console.log('Ocorreu um erro ao salvar os Dados')
    }))
    writeFile('api/eggs.json', JSON.stringify(EggsMapping, null, 2), {}, ((err) => {
        if (err) console.log('Ocorreu um erro ao salvar os Dados')
    }))
}