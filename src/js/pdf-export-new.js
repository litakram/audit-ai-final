function exportPDFWithStructuredData(insightsData) {

    // Préparer les données pour le template PDF
    // Adaptation pour le nouveau format JSON
    const rapport = insightsData.rapport_audit_ia || {};
    const infos = rapport.informations_entreprise || {};
    const axes = rapport.axes || [];
    const feuilleDeRoute = rapport.feuille_de_route || {};
    const analyseDetaillee = rapport.analyse_Detaillee || {};

    console.log('Rapport:', rapport);
    console.log('Infos:', infos);
    console.log('Axes:', axes);
    console.log('Feuille de route:', feuilleDeRoute);
    console.log('Analyse détaillée:', analyseDetaillee);

    if (insightsData) {
        console.log('Données structurées pour PDF:', insightsData);
    }

    function getAxisData(idx, prop, fallback = 'Non spécifié') {
        return axes[idx] && axes[idx][prop] ? axes[idx][prop] : fallback;
    }
    function getAxisScore(idx) {
        // Ex: "3.5/5" -> 3.5
        const scoreStr = getAxisData(idx, 'score', '0/5');
        const score = parseFloat(scoreStr.split('/')[0]);
        return isNaN(score) ? '0.0' : score.toFixed(1);
    }
    function getAxisStrength(idx, n) {
        const arr = getAxisData(idx, 'points_forts', []);
        return arr[n] || 'Non spécifié';
    }
    function getAxisWeakness(idx, n) {
        const arr = getAxisData(idx, 'faiblesses', []);
        return arr[n] || 'Non spécifié';
    }
    function getAxisRecommendation(idx, n) {
        const arr = getAxisData(idx, 'recommandations', []);
        return arr[n] || 'Non spécifié';
    }
    function getAxisEvaluation(idx) {
        return analyseDetaillee[`axis${idx+1}`] || 'Non spécifié';
    }
    function getRoadmapAction(n) {
        return feuilleDeRoute[n] || 'Non spécifié';
    }
    function getRoadmapConclusion() {
        return feuilleDeRoute.RoadmapConclusion || 'Non spécifié';
    }
    function getGlobalScore() {
        const scoreStr = rapport.score_global || '0/5';
        const score = parseFloat(scoreStr.split('/')[0]);
        return isNaN(score) ? '0.0' : score.toFixed(1);
    }
    function getMaturityLevel(score) {
        if (score >= 4.5) return "Excellence - Votre organisation est un leader en matière d'IA";
        if (score >= 3.5) return "Avancé - Bonne maturité avec quelques axes d'amélioration";
        if (score >= 2.5) return "Intermédiaire - Fondations solides, développement en cours";
        if (score >= 1.5) return "Débutant - Premiers pas vers la maturité IA";
        return "Initial - Opportunités significatives de développement";
    }

    const now = new Date();
    const reportDate = now.toLocaleDateString('fr-FR');
    const reportTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const pdfData = {
        companyName: infos.nom || 'Entreprise',
        companyEmail: infos.email || '',
        companyPhone: infos.telephone || '',
        reportDate: `${reportDate} ${reportTime}`,
        Score: getGlobalScore(),
        maturityLevel: getMaturityLevel(parseFloat(getGlobalScore())),
        
        // Scores par axe
        axis1Score: getAxisScore(0),
        axis2Score: getAxisScore(1),
        axis3Score: getAxisScore(2),
        axis4Score: getAxisScore(3),
        axis5Score: getAxisScore(4),
        axis6Score: getAxisScore(5),

        // Points forts et faiblesses par axe
        axis1Strength1: getAxisStrength(0, 0),
        axis1Strength2: getAxisStrength(0, 1),
        axis1Weakness1: getAxisWeakness(0, 0),
        axis1Weakness2: getAxisWeakness(0, 1),
        axis1Recommendation1: getAxisRecommendation(0, 0),
        axis1Recommendation2: getAxisRecommendation(0, 1),
        axis1Recommendation3: getAxisRecommendation(0, 2),

        axis2Strength1: getAxisStrength(1, 0),
        axis2Strength2: getAxisStrength(1, 1),
        axis2Weakness1: getAxisWeakness(1, 0),
        axis2Weakness2: getAxisWeakness(1, 1),
        axis2Recommendation1: getAxisRecommendation(1, 0),
        axis2Recommendation2: getAxisRecommendation(1, 1),
        axis2Recommendation3: getAxisRecommendation(1, 2),

        axis3Strength1: getAxisStrength(2, 0),
        axis3Strength2: getAxisStrength(2, 1),
        axis3Weakness1: getAxisWeakness(2, 0),
        axis3Weakness2: getAxisWeakness(2, 1),
        axis3Recommendation1: getAxisRecommendation(2, 0),
        axis3Recommendation2: getAxisRecommendation(2, 1),
        axis3Recommendation3: getAxisRecommendation(2, 2),

        axis4Strength1: getAxisStrength(3, 0),
        axis4Strength2: getAxisStrength(3, 1),
        axis4Weakness1: getAxisWeakness(3, 0),
        axis4Weakness2: getAxisWeakness(3, 1),
        axis4Recommendation1: getAxisRecommendation(3, 0),
        axis4Recommendation2: getAxisRecommendation(3, 1),
        axis4Recommendation3: getAxisRecommendation(3, 2),

        axis5Strength1: getAxisStrength(4, 0),
        axis5Strength2: getAxisStrength(4, 1),
        axis5Weakness1: getAxisWeakness(4, 0),
        axis5Weakness2: getAxisWeakness(4, 1),
        axis5Recommendation1: getAxisRecommendation(4, 0),
        axis5Recommendation2: getAxisRecommendation(4, 1),
        axis5Recommendation3: getAxisRecommendation(4, 2),

        axis6Strength1: getAxisStrength(5, 0),
        axis6Strength2: getAxisStrength(5, 1),
        axis6Weakness1: getAxisWeakness(5, 0),
        axis6Weakness2: getAxisWeakness(5, 1),
        axis6Recommendation1: getAxisRecommendation(5, 0),
        axis6Recommendation2: getAxisRecommendation(5, 1),
        axis6Recommendation3: getAxisRecommendation(5, 2),

        // Évaluations détaillées par axe
        axis1DetailedEvaluation: getAxisEvaluation(0),
        axis2DetailedEvaluation: getAxisEvaluation(1),
        axis3DetailedEvaluation: getAxisEvaluation(2),
        axis4DetailedEvaluation: getAxisEvaluation(3),
        axis5DetailedEvaluation: getAxisEvaluation(4),
        axis6DetailedEvaluation: getAxisEvaluation(5),

        // Analyse globale
        globalAnalysis: rapport.analyse_globale || 'Non spécifié',

        // Actions prioritaires
        Action1Title: 'Action 1:',
        Action1: getRoadmapAction('1'),
        Action2Title: 'Action 2:',
        Action2: getRoadmapAction('2'),
        Action3Title: 'Action 3:',
        Action3: getRoadmapAction('3'),
        Action4Title: 'Action 4:',
        Action4: getRoadmapAction('4'),
        Action5Title: 'Action 5:',
        Action5: getRoadmapAction('5'),

        RoadmapConclusion: getRoadmapConclusion()
    };
    
    // Préparer les données pour les graphiques
    const axesData = {
        axesLabels: ['Stratégie IA', 'Data', 'Technologies', 'Gouvernance', 'Culture', 'Infrastructure'],
        axesScores: [
            parseFloat(pdfData.axis1Score) || 0,
            parseFloat(pdfData.axis2Score) || 0,
            parseFloat(pdfData.axis3Score) || 0,
            parseFloat(pdfData.axis4Score) || 0,
            parseFloat(pdfData.axis5Score) || 0,
            parseFloat(pdfData.axis6Score) || 0
        ]
    };
    
    // Charger le template PDF et remplacer les placeholders
    fetch('/pdf.html')
      .then(response => response.text())
      .then(template => {
        let populatedTemplate = template;
        
        // Remplacer tous les placeholders dans le template
        Object.keys(pdfData).forEach(key => {
          const placeholder = new RegExp(`\\$\{${key}\}`, 'g');
          populatedTemplate = populatedTemplate.replace(placeholder, pdfData[key]);
        });

        // Créer une nouvelle fenêtre pour le PDF
        const newWindow = window.open('', '_blank');
        newWindow.document.write(populatedTemplate);
        newWindow.document.close();

        // Transférer les données des axes à la nouvelle fenêtre
        newWindow.axesData = axesData;
        
        // Attendre que la fenêtre soit complètement chargée
        const checkReady = setInterval(() => {
          if (newWindow.document.readyState === 'complete') {
            clearInterval(checkReady);
            
            // S'assurer que les graphiques sont rendus
            setTimeout(() => {
              // Vérifier si la fonction de rendu des graphiques existe et l'appeler
              if (typeof newWindow.renderCharts === 'function') {
                newWindow.renderCharts(axesData);
              }
              
              // Déclencher l'export PDF après un délai pour s'assurer que tout est rendu
              setTimeout(() => {
                newWindow.exportToPDF();
              }, 1500);
            }, 1000);
          }
        }, 100);
      })
      .catch(error => {
        console.error('Erreur lors du chargement du template PDF:', error);
        app.showNotification('Erreur lors de la génération du PDF', 'error');
      });
}