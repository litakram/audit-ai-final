// Fonction pour générer des insights IA basés sur les réponses au questionnaire avec l'API Gemini
async function generateGeminiInsights() {
    // Récupérer les données de l'audit depuis l'application
    const auditData = prepareAuditDataForInsights();
    
    // Construire le prompt avec les données d'audit
    const insightsPrompt = buildInsightsPrompt(auditData);
    
    try {
        // Appeler l'API Gemini
        const response = await callGeminiAPI(insightsPrompt);
        
        // Afficher les insights
        displayInsights(response);
        
        return response;
    } catch (error) {
        console.error('Erreur lors de la génération des insights avec Gemini:', error);
        app.showNotification('Erreur lors de la génération des insights', 'error');
        return null;
    }
}

// Prépare les données d'audit dans un format approprié pour l'API (même fonction que insights-api.js)
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

// Construit le prompt pour l'API en fonction des données d'audit (même fonction que insights-api.js)
function buildInsightsPrompt(auditData) {
    // Base du prompt
    let prompt = `Tu es un consultant senior en audit IA avec plus de 20 ans d'expérience. Analyse en profondeur les données d'audit suivantes et génère un rapport d'insights détaillé en français. Ne mentionne pas ton rôle de consultant ni ton expérience dans le rapport.
Pour chaque axe (non les sous-axes):
1. Identifie les 2 points forts majeurs (scores élevés des axes et non des sous-axes) et explique pourquoi ils représentent un avantage
2. Identifie les 2 faiblesses critiques (scores bas des axes et non des sous-axes) et explique les risques associés
3. Propose 2-3 recommandations concrètes et actionnables sur mesure pour faire progresser votre maturité IA en points faibles

Ensuite:
- Fais une évaluation détaillée de l'organisation selon les 6 axes clés
- Fais une analyse globale de la maturité IA de l'organisation
- Suggère une feuille de route d'amélioration avec 3-5 actions prioritaires
- Utilise un langage clair et professionnel, adapté à un public non technique
- Présente les résultats de manière structurée avec des titres et sous-titres (markdown)
- Utilise les données de l'entreprise pour contextualiser les recommandations

Présente le tout dans un format structuré avec des titres clairs et un langage professionnel mais accessible, utilisant les données de l'entreprise et la signification des scores.
Voici les données d'audit: \n\n`;

    // Ajouter les infos de l'entreprise
    prompt += `INFORMATIONS ENTREPRISE:\n`;
    prompt += `Nom: ${auditData.company.name || 'Non spécifié'}\n`;
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
        let generatedText = '';
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && data.candidates[0].content.parts) {
            data.candidates[0].content.parts.forEach(part => {
                if (part.text) {
                    generatedText += part.text;
                }
            });
        } else {
            throw new Error('Format de réponse Gemini inattendu');
        }
        
        return generatedText;
    } catch (error) {
        console.error('Erreur lors de l\'appel API Gemini:', error);
        throw error;
    }
}

// Affiche les insights générés dans l'interface utilisateur (même fonction que insights-api.js)
function displayInsights(insightsText) {
    const container = document.getElementById('insights-content');
    if (!container) return;

    // Ne pas sauvegarder les insights dans localStorage - générer de nouveaux insights à chaque fois
    
    // Filtrer la ligne "Consultant: Consultant Senior en Audit IA"
    insightsText = insightsText.replace(/Consultant\s*:\s*.*?(?:\r?\n|$)/gi, '');
    
    // Créer un élément temporaire pour analyser le markdown
    const parsedContent = parseMarkdownToHTML(insightsText);

    // Ajouter le résumé exécutif au début
    const globalScore = app.calculateGlobalScore();
    
    container.innerHTML = `
        <div class="insights-summary" style="background-color: #b4c5d5ff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 32px;">
            <h3 class="section-title" style="color: #081d3f; border-bottom: 2px solid #ECDC2C; padding-bottom: 12px; margin-bottom: 20px;">
                Résumé Exécutif
            </h3>
            <div class="summary-card" style="background-color: #a4b8caff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 24px;">
                <div class="summary-score" style="background: linear-gradient(135deg, #081d3f 0%, #1e3a6e 100%); color: white; padding: 16px; border-radius: 50%; height: 100px; width: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span class="score-value" style="font-size: 2rem; font-weight: 700;">${globalScore.toFixed(1)}</span>
                    <span class="score-label" style="font-size: 0.9rem;">/ 5.0</span>
                </div>
                <div class="summary-text" style="flex-grow: 1;">
                    <h4 style="color: #081d3f; margin-bottom: 8px;">Niveau de Maturité IA</h4>
                    <p style="font-size: 1.1rem; color: #1e293b; background-color: #b4c5d5ff; padding: 8px 16px; border-radius: 6px; border-left: 4px solid #ECDC2C;">${app.getMaturityLevel(globalScore)}</p>
                </div>
            </div>
        </div>

        <div class="insights-details" style="background-color: #b4c5d5ff; border-radius: 12px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <h3 class="section-title" style="color: #081d3f; border-bottom: 2px solid #ECDC2C; padding-bottom: 12px; margin-bottom: 24px;">
                Analyse Détaillée
            </h3>
            <div style="line-height: 1.6;">
                ${parsedContent}
            </div>
        </div>
    `;
}

// Fonction pour convertir le texte markdown en HTML (même fonction que insights-api.js)
function parseMarkdownToHTML(markdown) {
    // Une fonction basique de conversion Markdown → HTML
    // Dans une application réelle, vous pourriez utiliser une bibliothèque comme marked.js
    
    // Convertir les titres avec style
    let html = markdown
        .replace(/^# (.*$)/gim, '<h2 style="color: #081d3f; font-size: 1.7rem; margin-top: 28px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">$1</h2>')
        .replace(/^## (.*$)/gim, '<h3 style="color: #081d3f; font-size: 1.4rem; margin-top: 24px; margin-bottom: 14px; display: flex; align-items: center;"><i class="fas fa-angle-right" style="color: #ECDC2C; margin-right: 8px;"></i>$1</h3>')
        .replace(/^### (.*$)/gim, '<h4 style="color: #1e293b; font-size: 1.2rem; margin-top: 20px; margin-bottom: 12px; font-weight: 600;">$1</h4>')
        .replace(/^#### (.*$)/gim, '<h5 style="color: #334155; font-size: 1.1rem; margin-top: 16px; margin-bottom: 10px; font-weight: 500;">$1</h5>');
    
    // Convertir les listes avec style
    html = html
        .replace(/^\* (.*$)/gim, '<ul style="margin-left: 20px; margin-bottom: 16px;"><li style="margin-bottom: 8px; color: #171827ff;">$1</li></ul>')
        .replace(/^- (.*$)/gim, '<ul style="margin-left: 20px; margin-bottom: 16px;"><li style="margin-bottom: 8px; color: #171827ff;">$1</li></ul>')
        .replace(/^\d+\. (.*$)/gim, '<ol style="margin-left: 20px; margin-bottom: 16px;"><li style="margin-bottom: 8px; color: #171827ff;">$1</li></ol>');

    // Nettoyer les listes (fusionner les balises ul/ol adjacentes)
    html = html
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/<\/ol>\s*<ol>/g, '');
    
    // Convertir les paragraphes avec style
    html = html
        .replace(/^\s*(\n)?(.+)/gim, function (m) {
            return /\<(\/)?(h|ul|ol|li)/i.test(m) ? m : '<p style="margin-bottom: 16px; line-height: 1.6; color: #1e293b;">' + m + '</p>';
        })
        .replace(/\n{2,}/g, '<br><br>');
    
    // Convertir le texte en gras et italique avec style
    html = html
        .replace(/\*\*(.*)\*\*/gim, '<strong style="font-weight: 600; color: #081d3f;">$1</strong>')
        .replace(/\*(.*)\*/gim, '<em style="color: #000000ff; font-style: italic;">$1</em>');
    
    // Ajouter des sections type "carte" pour les points forts, faiblesses et recommandations
    html = html
        .replace(/<h3 style=".*?">(Points? Forts?|Forces|Avantages).*?<\/h3>/gi, 
                 '<div style="background-color: #9e9e9eff; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #0284c7;"><h3 style="color: #0284c7; font-size: 1.4rem; margin-top: 0; margin-bottom: 14px; display: flex; align-items: center;"><i class="fas fa-star" style="margin-right: 8px; color: #0284c7;"></i>$1</h3>')
        .replace(/<h3 style=".*?">(Points? Faibles?|Faiblesses|Axes? d\'Amélioration).*?<\/h3>/gi, 
                 '<div style="background-color: #9e9e9eff; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #e11d48;"><h3 style="color: #e11d48; font-size: 1.4rem; margin-top: 0; margin-bottom: 14px; display: flex; align-items: center;"><i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: #e11d48;"></i>$1</h3>')
        .replace(/<h3 style=".*?">(Recommandations?|Actions? Prioritaires?).*?<\/h3>/gi, 
                 '<div style="background-color: #9e9e9eff; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #16a34a;"><h3 style="color: #16a34a; font-size: 1.4rem; margin-top: 0; margin-bottom: 14px; display: flex; align-items: center;"><i class="fas fa-lightbulb" style="margin-right: 8px; color: #16a34a;"></i>$1</h3>')
        .replace(/<\/h3>\s*<ul/gi, '</h3><ul'); // Fix any spacing issues
    
    // Fermer les divs pour les sections spéciales
    let sections = ['Points? Forts?|Forces|Avantages', 'Points? Faibles?|Faiblesses|Axes? d\'Amélioration', 'Recommandations?|Actions? Prioritaires?'];
    sections.forEach(sectionPattern => {
        const regex = new RegExp(`<div style=".*?">.+?<h3 style=".*?">(?:${sectionPattern}).*?<\/h3>(.+?)(?=<div style="|$)`, 'si');
        html = html.replace(regex, (match, content) => {
            if (!match.endsWith('</div>')) {
                return match + '</div>';
            }
            return match;
        });
    });
    
    return html;
}
