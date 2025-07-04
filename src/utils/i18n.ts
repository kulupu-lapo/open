export const languages = {
  en: 'English',
  tok: 'toki pona',
};
export type Langcode = keyof typeof languages;
export const locales = Object.keys(languages) as Langcode[];
export const defaultLang = 'en';

const i18n_prefixes = locales.map( locale => ({ locale: locale, prefix: locale as string | undefined }) ).concat({ locale: defaultLang, prefix: undefined });

export async function getStaticLanguagePaths() {
  return i18n_prefixes.map(({locale, prefix}) => {
    return { params: { lang: prefix }, props: { lang: locale, langPrefix: prefix === undefined ? '' : prefix + '/' }, };
  });
}

export function internationaliseStaticPaths<T,E>(paths : {params: T, props: E}[]) {
    return paths.flatMap(({ params, props }) => 
        i18n_prefixes.map(({locale, prefix})=>({
            params: {
                lang: prefix,
                ...params
            },
            props: {
                lang: locale,
                langPrefix: prefix === undefined ? '' : prefix + '/',
                ...props
            }
        }))
    )
} 

export function getLangFromUrl(url: URL) {
    const [, lang] = url.pathname.split('/');
    if ((locales as string[]).includes(lang)) return lang as Langcode;
    return defaultLang;
}

export function urlLocaliser(url: URL) {
    const [, lang] = url.pathname.split('/');
    const prefix = (locales as string[]).includes(lang) ? lang : ''
    return (path : string) => prefix + path 
}

export function translator<T extends Record<Langcode, Record<string, string>>>(dataset : T, langcode : Langcode) {
    type TranslationKey = keyof T[typeof defaultLang]
    return (key : TranslationKey, variables? : Record<string, string | number | string[]>) => {
        let template = key in dataset[langcode] ? 
            dataset[langcode][key as string] 
            : dataset[defaultLang][key as string]
        if (variables === undefined) variables = {}

        for (const [varname, value] of Object.entries(variables)) {
            if (Array.isArray(value)) {
                template = template.replaceAll(
                    new RegExp(`\\{${varname.replaceAll(/[.?*+]/g,"\\$&")} between='(.+)'\\}`, 'g'),
                    (_,seperator) => value.join(seperator))
            } else {
                template = template.replaceAll("{"+varname+"}", value.toString())
            }
        } 
        return template
    }
} 
