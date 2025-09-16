// Fonction pour générer des insights IA basés sur les réponses au questionnaire avec l'API Gemini
async function generateGeminiPdf() {
    // Récupérer les données de l'audit depuis l'application
    const auditData = app.prepareAuditDataForInsights();

    const pdfprompt = buildPdfPrompt(auditData);

    try {
        // generate pdf json
        const pdfResponse = await callGeminiAPI(pdfprompt);


        console.log('PDF Data :', pdfResponse);

        window.lastGeneratedPdf = pdfResponse;

        return pdfResponse;
    } catch (error) {
        console.error('Erreur lors de la génération des pdf avec Gemini:', error);
        app.showNotification('Erreur lors de la génération des pdf', 'error');
        return null;
    }
}


// Prépare les données d'audit dans un format approprié pour l'API 
function prepareAuditDataForInsights() {
    if (!app.questionnaire || !app.responses) {
        console.error('Le questionnaire ou les réponses ne sont pas disponibles');
        return {};
    }

    const auditData = {
        globalScore: app.calculateGlobalScore(),
        company: app.companyInfo,
        axes: []
    };

    // Compiler les informations pour chaque axe
    app.questionnaire.axes.forEach(axis => {
        const axisScore = app.calculateAxisScore(axis.id);
        const axisCompletion = app.getAxisCompletion(axis.id);

        const axisData = {
            id: axis.id,
            title: axis.title,
            score: axisScore,
            completion: axisCompletion,
            weight: axis.weight_percent,
            sub_axes: []
        };

        // Compiler les informations pour chaque sous-axe
        axis.sub_axes.forEach(subAxis => {
            const subAxisScore = app.calculateSubAxisScoreForAxis(axis.id, subAxis.id);
            const subAxisCompletion = app.getSubAxisCompletionForAxis(axis.id, subAxis.id);

            const subAxisData = {
                id: subAxis.id,
                title: subAxis.title,
                score: subAxisScore,
                completion: subAxisCompletion,
                questions: []
            };

            // Compiler les réponses pour chaque question
            subAxis.questions.forEach(question => {
                const response = app.responses[question.id] || {};
                const score = response.score !== undefined ? response.score : 0;
                const notes = response.notes || '';

                // Obtenir la signification du score
                const scoreSignification = question.notes ? question.notes[score] || '' : '';

                subAxisData.questions.push({
                    id: question.id,
                    text: question.text,
                    score: score,
                    signification: scoreSignification,
                    notes: notes,
                    isAnswered: response.score !== undefined
                });
            });

            axisData.sub_axes.push(subAxisData);
        });

        auditData.axes.push(axisData);
    });

    return auditData;
}



function buildPdfPrompt(auditData) {
    // Base du prompt
    let prompt = `Analyse les données d'audit suivantes et génère un rapport d'insights détaillé en français, au format JSON strict. 

Pour chaque axe (non les sous-axes):

- Identifie 2 points forts majeurs ou tu montres pourquoi ils sont un avantage.
- Identifie 2 faiblesses critiques ou tu mentionnes les risques associés.
- Propose 2-3 recommandations concrètes et actionnables pour améliorer la maturité IA sur les points faibles.

Ensuite:

- Fais une évaluation détaillée de l'organisation selon les 6 axes clés.
- Fais une analyse globale de la maturité IA de l'organisation.
- Suggère une feuille de route d'amélioration avec 3-5 actions prioritaires.
- Utilise un langage clair et professionnel, adapté à un public non technique.
- Utilise les données de l'entreprise pour contextualiser les recommandations.
- Ne mentionne pas ton rôle de consultant ni ton expérience dans le rapport.
- Présente les résultats dans le json values de manière markdown
- Réponds uniquement avec le JSON demandé, sans texte additionnel.

Présente le tout dans un format structuré avec des titres clairs et un langage professionnel mais accessible, utilisant les données de l'entreprise et la signification des scores.

Voici les données d'audit: \n\n`;

    // Ajouter les infos de l'entreprise
    prompt += `INFORMATIONS ENTREPRISE:\n`;
    prompt += `Nom: ${auditData.company.name || 'Non spécifié'}\n`;
    prompt += `Email: ${auditData.company.email || 'Non spécifié'}\n`;
    prompt += `Téléphone: ${auditData.company.phone || 'Non spécifié'}\n`;
    prompt += `Secteur: ${auditData.company.sector || 'Non spécifié'}\n`;
    prompt += `Taille: ${auditData.company.size || 'Non spécifiée'}\n`;
    prompt += `Description: ${auditData.company.description || 'Non spécifiée'}\n\n`;

    // Score global
    prompt += `SCORE GLOBAL: ${auditData.globalScore.toFixed(1)}/5\n\n`;

    // Détails par axe
    prompt += `DÉTAILS PAR AXE:\n\n`;

    auditData.axes.forEach(axis => {
        prompt += `AXE ${axis.id}: ${axis.title}\n`;
        prompt += `Score: ${axis.score.toFixed(1)}/5\n`;
        prompt += `Poids: ${axis.weight}%\n`;
        prompt += `Complétion: ${axis.completion}%\n\n`;

        // Détails des sous-axes
        axis.sub_axes.forEach(subAxis => {
            prompt += `  SOUS-AXE ${subAxis.id}: ${subAxis.title}\n`;
            prompt += `  Score: ${subAxis.score.toFixed(1)}/5\n`;
            prompt += `  Complétion: ${subAxis.completion}%\n\n`;

            // Détails des questions
            subAxis.questions.forEach(question => {
                prompt += `    QUESTION ${question.id}: ${question.text}\n`;
                prompt += `    Score: ${question.score}/5\n`;
                if (question.signification) {
                    prompt += `    Signification: ${question.signification}\n`;
                }
                if (question.notes) {
                    prompt += `    Notes: ${question.notes}\n`;
                }
                prompt += `\n`;
            });
        });

        prompt += `-------------------------------------------\n\n`;

        prompt += `Example JSON :
        
        {
    "rapport_audit_ia": {
        "informations_entreprise": {
            "nom": "xx",
            "secteur": "xx",
            "taille": "xx",
            "description": "xx",
            "site_web": "xx",
            "email": "xx",
            "telephone": "xx"
        },
        "score_global": "X/5",
        "axes": [
            {
                "nom": "STRATÉGIE IA",
                "score": "X/5",
                "poids": "25%",
                "points_forts": [
                    "xxx",
                    "xxx"
                ],
                "faiblesses": [
                    "xxx",
                    "xxx"
                ],
                "recommandations": [
                    "xxx",
                    "xxx",
                    "xxx"
                ]
            },
            {
                "nom": "DATA",
                "score": "X/5",
                "poids": "20%",
                "points_forts": [
                    "xxx",
                    "xxx"
                ],
                "faiblesses": [
                    "xxx",
                    "xxx"
                ],
                "recommandations": [
                    "xxx",
                    "xxx",
                    "xxx"
                ]
            },
            {
                "nom": "TECHNOLOGIES",
                "score": "X/5",
                "poids": "18%",
                "points_forts": [
                    "xxx",
                    "xxx"
                ],
                "faiblesses": [
                    "xxx",
                    "xxx"
                ],
                "recommandations": [
                    "xxx",
                    "xxx",
                    "xxx"
                ]
            },
            {
                "nom": "GOUVERNANCE",
                "score": "X/5",
                "poids": "15%",
                "points_forts": [
                    "xxx",
                    "xxx"
                ],
                "faiblesses": [
                    "xxx",
                    "xxx"
                ],
                "recommandations": [
                    "xxx",
                    "xxx",
                    "xxx"
                ]
            },
            {
                "nom": "CULTURE ORGANISATIONNELLE",
                "score": "X/5",
                "poids": "12%",
                "points_forts": [
                    "xxx",
                    "xxx"
                ],
                "faiblesses": [
                    "xxx",
                    "xxx"
                ],
                "recommandations": [
                    "xxx",
                    "xxx",
                    "xxx"
                ]
            },
            {
                "nom": "INFRASTRUCTURE",
                "score": "X/5",
                "poids": "10%",
                "points_forts": [
                    "xxx",
                    "xxx"
                ],
                "faiblesses": [
                    "xxx",
                    "xxx"
                ],
                "recommandations": [
                    "xxx",
                    "xxx",
                    "xxx"
                ]
            }
        ],
        "analyse_Detaillee": {
            "axis1": "xxxxx",
            "axis2": "xxxxx",
            "axis3": "xxxxx",
            "axis4": "xxxxx",
            "axis5": "xxxxx"
        }
        ,
        "analyse_globale": "xxxxxxxxxxx",
        "feuille_de_route": {
            "1": "xxxxx",
            "2": "xxxxx",
            "3": "xxxxx",
            "4": "xxxxx",
            "5": "xxxxx",
            "RoadmapConclusion": "xxxxxxxx"
        }
    }
}
`;
    });


    return prompt;
}



// Appelle l'API Gemini pour générer les insights
async function callGeminiAPI(insightsPrompt) {
    const API_KEY = 'AIzaSyCMZr1IfG_fHgDQDW8a0apjuv4qJGqlos0';
    const MODEL = 'gemini-2.0-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: insightsPrompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erreur API Gemini: ${response.status}, ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        // Extraire le texte de la réponse de l'API Gemini
        let generatedJson;
        try {
            // Nettoyage de la réponse pour s'assurer qu'elle contient du JSON valide
            let responseText = data.candidates[0].content.parts[0].text;

            // Trouver le premier caractère '{' et le dernier caractère '}'
            const startIndex = responseText.indexOf('{');
            const endIndex = responseText.lastIndexOf('}') + 1;

            if (startIndex >= 0 && endIndex > 0 && endIndex > startIndex) {
                // Extraire uniquement la partie JSON de la réponse
                responseText = responseText.substring(startIndex, endIndex);
                generatedJson = JSON.parse(responseText);
            } else {
                throw new Error('Structure JSON non trouvée dans la réponse');
            }
        } catch (e) {
            console.error('Erreur lors du parsing JSON de la réponse Gemini:', e, data.candidates[0].content.parts[0].text);
            throw new Error('Format de réponse Gemini inattendu: JSON invalide');
        }

        return generatedJson;
    } catch (error) {
        console.error('Erreur lors de l\'appel API Gemini:', error);
        throw error;
    }
}

