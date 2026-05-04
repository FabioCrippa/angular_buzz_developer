# Mapeamento de Arquivo -> Prefixo (3-4 letras) para novo sistema de IDs
# Formato: arquivo.json -> ana-xxx (3-4 letras) para máxima clareza sem ambiguidade

$fileMapping = @{
    # ANÁLISE E DESENVOLVIMENTO (ana-)
    "angular.json" = "ana-ang"
    "css.json" = "ana-css"
    "debugging-frontend.json" = "ana-deb"
    "html.json" = "ana-htm"
    "react.json" = "ana-rea"
    "responsividade.json" = "ana-res"
    "figma.json" = "ana-fig"
    "micro-front-end.json" = "ana-mic"
    "boas-praticas.json" = "ana-boa"
    "javascript.json" = "ana-jav"
    "typescript.json" = "ana-typ"
    "ci-cd.json" = "ana-cic"
    "code-review.json" = "ana-cod"
    "devops.json" = "ana-dev"
    "scrum.json" = "ana-scr"
    "testes-unitarios.json" = "ana-tes"
    "versionamento.json" = "ana-ver"
    "entrevista-tecnica.json" = "ana-ent"
    "autenticacao.json" = "ana-aut"
    "criptografia.json" = "ana-cri"
    
    # INFORMÁTICA GERAL (inf-)
    "hardware.json" = "inf-har"
    "internet.json" = "inf-int"
    "sistemasOperacionais.json" = "inf-sis"
    "editorTexto.json" = "inf-edi"
    "planilhas.json" = "inf-pla"
    "redes.json" = "inf-red"
    
    # MATEMÁTICA (mat-)
    "raciocinio-logico.json" = "mat-rac"
    "algebra.json" = "mat-alg"
    "equacoes.json" = "mat-equ"
    "geometria.json" = "mat-geo"
    "porcentagem.json" = "mat-por"
    "proporcao.json" = "mat-pro"
    "razao.json" = "mat-raz"
    "regraTres.json" = "mat-reg"
    
    # PORTUGUÊS (port-)
    "gramatica.json" = "port-gra"
    "ortografia.json" = "port-ort"
    "semantica.json" = "port-sem"
    "coerencia.json" = "port-coe"
    "coesao.json" = "port-ces"
    "interpretacao.json" = "port-int"
    "redacao.json" = "port-red"
}

# Exportar para uso nos scripts
Export-ModuleMember -Variable fileMapping
