// ==================== APPLICATION STATE =====================
class AuditApp {
    constructor() {
        this.currentView = 'overview';
        this.currentAxis = 0;
        this.questionnaire = null;
        this.responses = {};
        this.companyInfo = {};
        this.charts = {};
        
        this.init();
    }

    async init() {
        try {
            await this.loadQuestionnaire();
            this.loadSavedData();
            this.setupEventListeners();
            this.updateUI();
            this.checkAndShowKPISection(); // Vérifie si on doit afficher la section KPI
            this.showNotification('Application initialisée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.showNotification('Erreur lors du chargement de l\'application', 'error');
        }
    }

    async loadQuestionnaire() {
        try {
            const response = await fetch('questionnaire_maturite_ia_corrected.json');
            this.questionnaire = await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement du questionnaire:', error);
            throw error;
        }
    }

    loadSavedData() {
        const savedResponses = localStorage.getItem('audit-responses');
        const savedCompanyInfo = localStorage.getItem('company-info');
        
        if (savedResponses) {
            this.responses = JSON.parse(savedResponses);
        }
        
        if (savedCompanyInfo) {
            this.companyInfo = JSON.parse(savedCompanyInfo);
        }
        
        // Nettoyer les anciens insights s'ils existent
        localStorage.removeItem('audit-insights-text');
        localStorage.removeItem('audit-insights');
        localStorage.removeItem('audit-insights-generated');
        localStorage.removeItem('insights-generated');
        localStorage.removeItem('audit-insights-date');
        localStorage.removeItem('insights-date');
        localStorage.removeItem('audit-responses-hash');
        localStorage.removeItem('audit-responses-changed');
    }

    saveData() {
        localStorage.setItem('audit-responses', JSON.stringify(this.responses));
        localStorage.setItem('company-info', JSON.stringify(this.companyInfo));
        localStorage.setItem('last-update', new Date().toISOString());
        
        // Pas besoin de gérer les insights, car ils ne sont plus sauvegardés
    }

    setupEventListeners() {
        // Company form submission
        const companyForm = document.getElementById('company-form');
        if (companyForm) {
            companyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCompanyFormSubmit();
            });
        }

        // Auto-save on input changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('.rating-btn, .form-input, .form-textarea, .form-select')) {
                this.saveData();
                this.updateUI();
            } else if (e.target.matches('.notes-input')) {
                // Only save data, do not update UI to avoid leaving sub-axis
                this.saveData();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentView === 'audit') {
                this.showView('overview');
            }
        });
    }

    updateUI() {
        this.updateKPIs();
        this.updateProgress();
        this.updateLastUpdate();
        this.renderAuditNavigation();
        this.renderCurrentAxis();
    }

    updateUI2() {
        this.updateKPIs();
        this.updateProgress();
        this.updateLastUpdate();
        this.renderAuditNavigation();
        this.renderCurrentAxis();
    }

    updateKPIs() {
        const completionRate = this.calculateCompletionRate();
        const bestAxis = this.getBestAxis();

        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('best-axis').textContent = bestAxis || '-';
        
        // Vérifier si l'utilisateur a répondu à des questions et afficher la section KPI
        this.checkAndShowKPISection();
    }
    
    checkAndShowKPISection() {
        const kpiSection = document.getElementById('kpi-section');
        const heroSection = document.getElementById('hero-section');
        if (kpiSection) {
            const answeredQuestions = this.getAnsweredQuestions();
            if (answeredQuestions > 0) {
                kpiSection.style.display = 'block';
                heroSection.style.display = 'none';
            } else {
                kpiSection.style.display = 'none';
                heroSection.style.display = 'block';
            }
        }
    }

    updateProgress() {
        const completionRate = this.calculateCompletionRate();
        const progressFill = document.getElementById('overall-progress');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${completionRate}%`;
        }
        
        if (progressText) {
            const totalQuestions = this.getTotalQuestions();
            const answeredQuestions = this.getAnsweredQuestions();
            progressText.textContent = `${answeredQuestions}/${totalQuestions} questions`;
        }
    }

    updateLastUpdate() {
        const lastUpdate = localStorage.getItem('last-update');
        const element = document.getElementById('last-update');
        
        if (element && lastUpdate) {
            const date = new Date(lastUpdate);
            element.textContent = date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    calculateGlobalScore() {
        if (!this.questionnaire) return 0;

        let totalWeightedScore = 0;
        let totalWeight = 0;

        this.questionnaire.axes.forEach(axis => {
            const axisScore = this.calculateAxisScore(axis.id);
            const weight = axis.weight_percent / 100;
            totalWeightedScore += axisScore * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? totalWeightedScore : 0;
    }

    calculateAxisScore(axisId) {
        const axis = this.questionnaire.axes.find(a => a.id === axisId);
        if (!axis) return 0;

        let totalScore = 0;
        let totalQuestions = 0;

        axis.sub_axes.forEach(subAxis => {
            subAxis.questions.forEach(question => {
                const response = this.responses[question.id];
                // Pour le calcul du score, on utilise 0 par défaut pour les questions sans réponse
                const score = (response && response.score !== undefined) ? response.score : 0;
                totalScore += score;
                totalQuestions++;
            });
        });

        return totalQuestions > 0 ? totalScore / totalQuestions : 0;
    }

    calculateCompletionRate() {
        const totalQuestions = this.getTotalQuestions();
        const answeredQuestions = this.getAnsweredQuestions();
        return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    }

    getTotalQuestions() {
        if (!this.questionnaire) return 0;
        return this.questionnaire.axes.reduce((total, axis) => {
            return total + axis.sub_axes.reduce((subTotal, subAxis) => {
                return subTotal + subAxis.questions.length;
            }, 0);
        }, 0);
    }

    getAnsweredQuestions() {
        // Count only questions that have been explicitly answered by the user
        return Object.keys(this.responses).filter(key => 
            this.responses[key].score !== undefined
        ).length;
    }

    getBestAxis() {
        if (!this.questionnaire) return null;

        let bestAxis = null;
        let bestScore = -1;

        this.questionnaire.axes.forEach(axis => {
            const score = this.calculateAxisScore(axis.id);
            if (score > bestScore) {
                bestScore = score;
                bestAxis = axis.title;
            }
        });

        return bestAxis;
    }

    renderAuditNavigation() {
        const navContainer = document.getElementById('audit-nav');
        if (!navContainer || !this.questionnaire) return;

        navContainer.innerHTML = '';

        this.questionnaire.axes.forEach((axis, index) => {
            const axisScore = this.calculateAxisScore(axis.id);
            const axisCompletion = this.getAxisCompletion(axis.id);
            const isActive = index === this.currentAxis;
            const isCompleted = axisCompletion === 100;

            const navItem = document.createElement('div');
            navItem.className = `nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
            navItem.onclick = () => this.setCurrentAxis(index);

            navItem.innerHTML = `
                <div class="nav-icon">
                    <i class="fas ${this.getAxisIcon(axis.id)}" aria-hidden="true"></i>
                </div>
                <div class="nav-text">${axis.title}</div>
                <div class="nav-progress">${axisCompletion}%</div>
            `;

            navContainer.appendChild(navItem);
        });
    }

    getAxisIcon(axisId) {
        const icons = {
            1: 'fa-chart-line',
            2: 'fa-database',
            3: 'fa-microchip',
            4: 'fa-balance-scale',
            5: 'fa-users',
            6: 'fa-server'
        };
        return icons[axisId] || 'fa-circle';
    }

    getAxisCompletion(axisId) {
        const axis = this.questionnaire.axes.find(a => a.id === axisId);
        if (!axis) return 0;

        let totalQuestions = 0;
        let answeredQuestions = 0;

        axis.sub_axes.forEach(subAxis => {
            subAxis.questions.forEach(question => {
                totalQuestions++;
                if (this.responses[question.id] && this.responses[question.id].score !== undefined) {
                    answeredQuestions++;
                }
            });
        });

        return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    }

    renderCurrentAxis() {
        const contentContainer = document.getElementById('axis-content');
        const breadcrumbCurrent = document.getElementById('current-axis');
        
        if (!contentContainer || !this.questionnaire) return;

        const axis = this.questionnaire.axes[this.currentAxis];
        if (!axis) return;

        // Update breadcrumb
        if (breadcrumbCurrent) {
            breadcrumbCurrent.textContent = axis.title;
        }

        // Render axis content
        contentContainer.innerHTML = `
            <div class="axis-header">
                <h2 class="axis-title">
                    <i class="fas ${this.getAxisIcon(axis.id)} axis-icon" aria-hidden="true"></i>
                    ${axis.title}
                </h2>
                <p class="axis-description">
                    Évaluez votre organisation sur les aspects clés de ${axis.title.toLowerCase()}
                </p>
                <div class="weight-badge">
                    <i class="fas fa-weight-hanging" aria-hidden="true"></i>
                    Pondération: ${axis.weight_percent}%
                </div>
            </div>

            <div class="sub-axes">
                ${axis.sub_axes.map(subAxis => this.renderSubAxis(subAxis)).join('')}
            </div>
        `;

        // Setup sub-axis interactions
        this.setupSubAxisInteractions();
        this.updateNavigationButtons();
    }

    renderSubAxis(subAxis) {
        const subAxisScore = this.calculateSubAxisScore(subAxis.id);
        const subAxisCompletion = this.getSubAxisCompletion(subAxis.id);
        
        return `
            <div class="sub-axis" data-sub-axis="${subAxis.id}">
                <div class="sub-axis-header" onclick="toggleSubAxis('${subAxis.id}')">
                    <h3 class="sub-axis-title">${subAxis.title}</h3>
                    <div class="sub-axis-meta">
                        <span class="sub-axis-score">${subAxisScore.toFixed(1)}/5</span>
                        <span>${subAxisCompletion}%</span>
                        <i class="fas fa-chevron-down expand-icon" aria-hidden="true"></i>
                    </div>
                </div>
                <div class="sub-axis-content" id="content-${subAxis.id}">
                    <div class="questions">
                        ${subAxis.questions.map(question => this.renderQuestion(question)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderQuestion(question) {
        const response = this.responses[question.id] || {};
        const selectedScore = response.score;
        const notes = response.notes || '';

        // Get score meanings from question.notes (assume keys: 1,2,3,4,5)
        const scoreMeanings = question.notes || {};

        return `
            <div class="question-card" data-question="${question.id}">
                <div class="question-text">${question.text}</div>
                <div class="rating-section">
                    <div class="rating-controls" style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
                        ${[1, 2, 3, 4, 5].map(score => `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <button class="rating-btn ${selectedScore === score ? 'active' : ''}" 
                                        onclick="setRating('${question.id}', ${score})"
                                        aria-label="Note ${score}">
                                    ${score}
                                </button>
                                <span class="score-meaning" style="font-size: 0.95em; color: #64748b;">${scoreMeanings[score] || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    calculateSubAxisScore(subAxisId) {
        const axis = this.questionnaire.axes[this.currentAxis];
        const subAxis = axis.sub_axes.find(sa => sa.id === subAxisId);
        if (!subAxis) return 0;

        let totalScore = 0;
        let totalQuestions = 0;

        subAxis.questions.forEach(question => {
            const response = this.responses[question.id];
            // Pour le calcul du score, on utilise 0 par défaut pour les questions sans réponse
            const score = (response && response.score !== undefined) ? response.score : 0;
            totalScore += score;
            totalQuestions++;
        });

        return totalQuestions > 0 ? totalScore / totalQuestions : 0;
    }

    getSubAxisCompletion(subAxisId) {
        const axis = this.questionnaire.axes[this.currentAxis];
        const subAxis = axis.sub_axes.find(sa => sa.id === subAxisId);
        if (!subAxis) return 0;

        let totalQuestions = subAxis.questions.length;
        let answeredQuestions = 0;

        subAxis.questions.forEach(question => {
            if (this.responses[question.id] && this.responses[question.id].score !== undefined) {
                answeredQuestions++;
            }
        });

        return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    }
    
    // New methods to calculate sub-axis scores and completion for any axis, not just the current one
    calculateSubAxisScoreForAxis(axisId, subAxisId) {
        const axis = this.questionnaire.axes.find(a => a.id === axisId);
        if (!axis) return 0;
        
        const subAxis = axis.sub_axes.find(sa => sa.id === subAxisId);
        if (!subAxis) return 0;

        let totalScore = 0;
        let totalQuestions = 0;

        subAxis.questions.forEach(question => {
            const response = this.responses[question.id];
            // Pour le calcul du score, on utilise 0 par défaut pour les questions sans réponse
            const score = (response && response.score !== undefined) ? response.score : 0;
            totalScore += score;
            totalQuestions++;
        });

        return totalQuestions > 0 ? totalScore / totalQuestions : 0;
    }

    getSubAxisCompletionForAxis(axisId, subAxisId) {
        const axis = this.questionnaire.axes.find(a => a.id === axisId);
        if (!axis) return 0;
        
        const subAxis = axis.sub_axes.find(sa => sa.id === subAxisId);
        if (!subAxis) return 0;

        let totalQuestions = subAxis.questions.length;
        let answeredQuestions = 0;

        subAxis.questions.forEach(question => {
            if (this.responses[question.id] && this.responses[question.id].score !== undefined) {
                answeredQuestions++;
            }
        });

        return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    }

    setupSubAxisInteractions() {
        // No longer auto-expanding sub-axes
        // Just initialize interactions without auto-opening any sub-axis
        
        // This method is kept for potential future interactions
        // but doesn't automatically open any sub-axis
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) {
            prevBtn.disabled = this.currentAxis === 0;
        }

        if (nextBtn) {
            const isLastAxis = this.currentAxis === this.questionnaire.axes.length - 1;
            nextBtn.textContent = isLastAxis ? 'Terminer' : 'Suivant';
            nextBtn.innerHTML = isLastAxis ? 
                'Terminer <i class="fas fa-check" aria-hidden="true"></i>' : 
                'Suivant <i class="fas fa-chevron-right" aria-hidden="true"></i>';
        }
    }

    setCurrentAxis(index) {
        this.currentAxis = index;
        this.renderCurrentAxis();
        this.renderAuditNavigation();
    }

    navigateAxis(direction) {
        const newIndex = this.currentAxis + direction;
        
        if (direction > 0 && newIndex >= this.questionnaire.axes.length) {
            // Finished all axes, go to review
            this.showView('review');
            return;
        }
        
        if (newIndex >= 0 && newIndex < this.questionnaire.axes.length) {
            this.setCurrentAxis(newIndex);
        }
    }

    setRating(questionId, score) {
        if (!this.responses[questionId]) {
            this.responses[questionId] = {};
        }
        this.responses[questionId].score = score;
        this.saveData();
        
        // Update just the KPIs and progress without re-rendering the entire UI
        this.updateKPIs();
        this.updateProgress();
        this.updateLastUpdate();
        
        // Update the active button in the UI
        const questionButtons = document.querySelectorAll(`[data-question="${questionId}"] .rating-btn`);
        if (questionButtons.length > 0) {
            questionButtons.forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.textContent.trim()) === score) {
                    btn.classList.add('active');
                }
            });
        }
        
        // Find which sub-axis contains this question and update its metadata
        if (this.questionnaire && this.questionnaire.axes[this.currentAxis]) {
            const axis = this.questionnaire.axes[this.currentAxis];
            
            // Find which sub-axis contains this question
            let targetSubAxisId = null;
            axis.sub_axes.forEach(subAxis => {
                const questionExists = subAxis.questions.some(q => q.id === questionId);
                if (questionExists) {
                    targetSubAxisId = subAxis.id;
                }
            });
            
            // If we found the sub-axis, update its metadata in the DOM
            if (targetSubAxisId) {
                const subAxisScore = this.calculateSubAxisScore(targetSubAxisId);
                const subAxisCompletion = this.getSubAxisCompletion(targetSubAxisId);
                
                // Update the DOM with new values
                const scoreElement = document.querySelector(`[data-sub-axis="${targetSubAxisId}"] .sub-axis-score`);
                const completionElement = document.querySelector(`[data-sub-axis="${targetSubAxisId}"] .sub-axis-meta span:nth-child(2)`);
                
                if (scoreElement) {
                    scoreElement.textContent = `${subAxisScore.toFixed(1)}/5`;
                }
                
                if (completionElement) {
                    completionElement.textContent = `${subAxisCompletion}%`;
                }
            }
        }
        
        // Update the navigation sidebar without closing sub-axes
        this.renderAuditNavigation();
        
        // Vérifier si l'utilisateur a répondu à des questions et afficher la section KPI
        this.checkAndShowKPISection();
       
    }

    setNotes(questionId, notes) {
        if (!this.responses[questionId]) {
            this.responses[questionId] = {};
        }
        this.responses[questionId].notes = notes;
        this.saveData();
    }

    handleCompanyFormSubmit() {
        const form = document.getElementById('company-form');
        const formData = new FormData(form);
        
        this.companyInfo = {
            name: document.getElementById('company-name').value,
            description: document.getElementById('company-description').value,
            sector: document.getElementById('company-sector').value,
            size: document.getElementById('company-size').value,
            email: document.getElementById('company-email').value,
            phone: document.getElementById('company-phone-code').value + ' ' + document.getElementById('company-phone').value,
            website: document.getElementById('company-website').value
        };
        
        // Pas besoin de vérifier les insights précédents, on génère toujours des nouveaux

        this.saveData();
        this.generateInsights();
    }

    async generateInsights() {
        const loadingOverlay = document.getElementById('loading-overlay');
        const companySection = document.getElementById('company-info-section');
        const resultsSection = document.getElementById('results-section');

        // Show loading
        loadingOverlay.style.display = 'flex';

        try {
            // Hide company form and show results
            companySection.style.display = 'none';
            resultsSection.style.display = 'block';

            // Generate charts
            this.createCharts();

            // Generate AI insights
            await this.renderInsights();

            

            this.showNotification('Insights générés avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la génération des insights:', error);
            this.showNotification('Erreur lors de la génération des insights', 'error');
        } finally {
            loadingOverlay.style.display = 'none';

            // Send email with CSV data after insights are generated
            await this.sendAuditEmail();
        }
    }
    
    async sendAuditEmail() {
        try {
            // Get current date and time for email subject
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            // Create subject with company name if available
            const companyName = this.companyInfo.name || "Entreprise";
            const subject = `Audit de Maturité IA - ${companyName} - ${formattedDate}`;
            
            // Create CSV data
            const csvData = this.createCSVForEmail();
            
            // Format CSV data for HTML display in email
            const csvLines = csvData.split('\n');
            let csvHtml = '';
            
            // Process each section of the CSV separately for better formatting
            let currentSection = '';
            let insightSection = false;
            
            for (let i = 0; i < csvLines.length; i++) {
                const line = csvLines[i];
                
                // Handle section headers
                if (line === '' && i < csvLines.length - 1 && !csvLines[i+1].includes(',')) {
                    if (currentSection !== '') {
                        csvHtml += '</div>';
                    }
                    
                    // Check if this is the start of the insights section
                    if (i + 1 < csvLines.length && csvLines[i+1] === 'INSIGHTS ET RECOMMANDATIONS') {
                        insightSection = true;
                    } else {
                        insightSection = false;
                    }
                    
                    if (i + 1 < csvLines.length) {
                        currentSection = csvLines[i+1];
                        i++; // Skip the header line as we're handling it here
                        csvHtml += `<div style="margin-top: 20px; margin-bottom: 10px;">`;
                        csvHtml += `<h3 style="color: #081d3f; background-color: #b4c5d5ff; padding: 8px; border-radius: 5px;">${currentSection}</h3>`;
                    }
                    continue;
                }
                
                // Format regular lines
                if (insightSection) {
                    // For insights, preserve formatting but clean up quotes
                    let cleanLine = line;
                    if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
                        cleanLine = cleanLine.substring(1, cleanLine.length - 1);
                    }
                    cleanLine = cleanLine.replace(/""/g, '"');
                    
                    csvHtml += `<p style="margin: 5px 0; line-height: 1.5;">${cleanLine}</p>`;
                } else if (line.includes(',')) {
                    // For CSV data with commas, create a table-like format
                    const cells = this.parseCSVLine(line);
                    
                    if (cells[0] === 'Axe') {
                        // This is a header row
                        csvHtml += `<div style="display: grid; grid-template-columns: 20% 20% 40% 10% 10%; background-color: #b4c5d5ff; padding: 5px; margin: 5px 0; font-weight: bold;">`;
                        for (const cell of cells) {
                            csvHtml += `<div style="padding: 5px;">${cell}</div>`;
                        }
                        csvHtml += `</div>`;
                    } else {
                        // Data row
                        csvHtml += `<div style="display: grid; grid-template-columns: 20% 20% 40% 10% 10%; border-bottom: 1px solid #e2e8f0; padding: 5px; margin: 5px 0;">`;
                        for (const cell of cells) {
                            csvHtml += `<div style="padding: 5px;">${cell}</div>`;
                        }
                        csvHtml += `</div>`;
                    }
                } else {
                    // For other lines (like simple key-value data)
                    csvHtml += `<p style="margin: 5px 0;">${line}</p>`;
                }
            }
            
            if (currentSection !== '') {
                csvHtml += '</div>';
            }
            
            // Generate email body with CSV content embedded
            const globalScore = this.calculateGlobalScore();
            const message = `
                <h2 style="color: #081d3f;">Rapport d'Audit de Maturité IA</h2>
                <p><strong>Entreprise :</strong> ${this.companyInfo.name || 'Non spécifié'}</p>
                <p><strong>Date :</strong> ${formattedDate}</p>
                <p><strong>Score global :</strong> ${globalScore.toFixed(2)}/5</p>
                <p><strong>Niveau de maturité :</strong> ${this.getMaturityLevel(globalScore)}</p>
                
                <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
                
                <div style="font-family: Arial, sans-serif; font-size: 14px;">
                    ${csvHtml}
                </div>
                
                <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
                
                <p>Ce rapport a été généré automatiquement par l'application Audit de Maturité IA.</p>
                <p>Pour visualiser le rapport complet avec les graphiques, veuillez vous connecter à l'application.</p>
                <br>
                <p>Cordialement,</p>
                <p>L'équipe Audit de Maturité IA</p>
            `;
            
            // Create attachment
            const csvBlob = new Blob([csvData], { type: 'text/csv' });
            const csvFile = new File([csvBlob], `audit-maturite-ia-${formattedDate.replace(/\//g, '-')}.csv`, { type: 'text/csv' });
            
            // Convert file to base64
            const base64data = await this.fileToBase64(csvFile);
            
            // Prepare attachments array
            const attachments = [{
                filename: `audit-maturite-ia-${formattedDate.replace(/\//g, '-')}.csv`,
                content: base64data.split('base64,')[1],
                encoding: 'base64'
            }];
            
            // Send the email
            const response = await fetch('https://mail-api-gamma.vercel.app/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: "akramlitniti4@gmail.com",
                    cc: "litnitiakram1@gmail.com",
                    subject: subject,
                    message: message,
                    isHtml: true,
                    attachments: attachments
                })
            });

            const result = await response.json();

            if (response.ok) {
            } else {
                console.error('Erreur lors de l\'envoi du mail:', result.message);
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du mail:', error);
        }
    }
    
    // Helper function to convert a file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    // Helper function to parse CSV lines properly, handling quoted fields with commas
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    // Double quotes inside quotes - add a single quote
                    current += '"';
                    i++;
                } else {
                    // Toggle the inQuotes flag
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Don't forget the last field
        result.push(current);
        return result;
    }
    
    // Create CSV content for email attachment
    createCSVForEmail() {
        // Get current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const formattedTime = currentDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create array for CSV content
        let csvLines = [];
        
        // Add user information at the top
        csvLines.push('Audit de Maturité IA - Rapport CSV');
        csvLines.push(`Date: ${formattedDate}, Heure: ${formattedTime}`);
        csvLines.push('');
        
        // Add company information if available
        csvLines.push('INFORMATIONS DE L\'ENTREPRISE');
        csvLines.push(`Nom: "${this.companyInfo.name || 'Non spécifié'}"`);
        csvLines.push(`Description: "${this.companyInfo.description || 'Non spécifié'}"`);
        csvLines.push(`Secteur: "${this.companyInfo.sector || 'Non spécifié'}"`);
        csvLines.push(`Taille: "${this.companyInfo.size || 'Non spécifié'}"`);
        csvLines.push(`Email: "${this.companyInfo.email || 'Non spécifié'}"`);
        csvLines.push(`Téléphone: "${this.companyInfo.phone || 'Non spécifié'}"`);
        csvLines.push(`Site Web: "${this.companyInfo.website || 'Non spécifié'}"`);
        csvLines.push('');
        
        // Add global score
        const globalScore = this.calculateGlobalScore();
        csvLines.push('SCORE GLOBAL');
        csvLines.push(`Score de maturité: ${globalScore.toFixed(2)}/5`);
        csvLines.push(`Niveau de maturité: ${this.getMaturityLevel(globalScore)}`);
        csvLines.push('');
        
        // Add axis scores
        csvLines.push('SCORES PAR AXE');
        if (this.questionnaire) {
            this.questionnaire.axes.forEach(axis => {
                const axisScore = this.calculateAxisScore(axis.id);
                csvLines.push(`${axis.title}: ${axisScore.toFixed(2)}/5`);
            });
        }
        csvLines.push('');
        
        // Add the regular audit data (questions and responses)
        csvLines.push('DÉTAIL DES RÉPONSES');
        csvLines.push('Axe,Sous-Axe,Question,Score');
        
        const data = this.prepareExportData();
        data.forEach(row => {
            csvLines.push(`"${row.axe}","${row.sous_axe}","${row.question}","${row.score}"`);
        });
        
        // Add AI insights at the end
        csvLines.push('');
        csvLines.push('INSIGHTS ET RECOMMANDATIONS');
        
        // Try to get insights content from the DOM
        const insightsContent = document.getElementById('insights-content');
        if (insightsContent) {
            // Clean and format the insights text, preserving line breaks
            const insightsText = insightsContent.innerText
                .split('\n')
                .filter(line => line.trim() !== '') // Éliminer les lignes vides
                .map(line => `"${line.replace(/"/g, '""')}"`);
            
            // Add each line separately
            csvLines.push(...insightsText);
        } else {
            csvLines.push('"Insights non disponibles"');
        }
        
        // Join all lines with newline characters
        return csvLines.join('\n');
    }

    createCharts() {
        this.createRadarChart();
        this.createBarChart();
        this.createDoughnutChart();
    }

    createRadarChart() {
        const ctx = document.getElementById('radar-chart');
        if (!ctx) return;

        const data = this.questionnaire.axes.map(axis => this.calculateAxisScore(axis.id));
        const labels = this.questionnaire.axes.map(axis => axis.title);

        if (this.charts.radar) {
            this.charts.radar.destroy();
        }

        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score Actuel',
                    data: data,
                    backgroundColor: 'rgba(8, 29, 63, 0.2)',
                    borderColor: 'rgba(8, 29, 63, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(8, 29, 63, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(8, 29, 63, 1)'
                }, {
                    label: 'Cible Excellence',
                    data: [5, 5, 5, 5, 5, 5],
                    backgroundColor: 'rgba(236, 220, 44, 0.1)',
                    borderColor: 'rgba(236, 220, 44, 0.5)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointBackgroundColor: 'rgba(236, 220, 44, 0.5)',
                    pointBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createBarChart() {
        const ctx = document.getElementById('bar-chart');
        if (!ctx) return;

        const data = this.questionnaire.axes.map(axis => this.calculateAxisScore(axis.id));
        const labels = this.questionnaire.axes.map(axis => axis.title);

        if (this.charts.bar) {
            this.charts.bar.destroy();
        }

        this.charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score Actuel',
                    data: data,
                    backgroundColor: [
                        'rgba(8, 29, 63, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(249, 115, 22, 0.8)'
                    ],
                    borderColor: [
                        'rgba(8, 29, 63, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(249, 115, 22, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createDoughnutChart() {
        const ctx = document.getElementById('doughnut-chart');
        if (!ctx) return;

        const weights = this.questionnaire.axes.map(axis => axis.weight_percent);
        const labels = this.questionnaire.axes.map(axis => `${axis.title} (${axis.weight_percent}%)`);

        if (this.charts.doughnut) {
            this.charts.doughnut.destroy();
        }

        this.charts.doughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: weights,
                    backgroundColor: [
                        'rgba(8, 29, 63, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(249, 115, 22, 0.8)'
                    ],
                    borderColor: [
                        'rgba(8, 29, 63, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(249, 115, 22, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async renderInsights() {
        const container = document.getElementById('insights-content');
        if (!container) return;

        const globalScore = this.calculateGlobalScore();

        try {
            // Appeler la fonction de génération d'insights Gemini
            await generateGeminiInsights();
        } catch (error) {
            console.error('Erreur lors de la génération des insights:', error);
            
            // En cas d'erreur, afficher un message d'erreur et des insights par défaut
            container.innerHTML = `
                <div class="insights-summary">
                    <h3 class="section-title">
                        Résumé Exécutif
                        <span class="model-badge gemini">Powered by Gemini AI</span>
                    </h3>
                    <div class="summary-card">
                        <div class="summary-score">
                            <span class="score-value">${globalScore.toFixed(1)}</span>
                            <span class="score-label">/ 5.0</span>
                        </div>
                        <div class="summary-text">
                            <h4>Niveau de Maturité IA</h4>
                            <p>${this.getMaturityLevel(globalScore)}</p>
                        </div>
                    </div>
                </div>

                <div class="insights-details">
                    <h3 class="section-title">
                        Analyse Détaillée
                        <span class="model-badge gemini">Powered by Gemini AI</span>
                    </h3>
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Nous n'avons pas pu générer les insights. Veuillez réessayer plus tard.</p>
                    </div>
                    <div class="insight-section">
                        <h4><i class="fas fa-star" aria-hidden="true"></i> Points Forts</h4>
                        <ul>
                            <li>Engagement de la direction générale dans la transformation IA</li>
                            <li>Qualité des données disponibles pour les projets IA</li>
                        </ul>
                    </div>
                    <div class="insight-section">
                        <h4><i class="fas fa-exclamation-triangle" aria-hidden="true"></i> Axes d'Amélioration</h4>
                        <ul>
                            <li>Développer une stratégie IA plus structurée</li>
                            <li>Renforcer la gouvernance des projets IA</li>
                        </ul>
                    </div>
                </div>
            `;
            
            this.showNotification('Erreur lors de la génération des insights', 'error');
        }
    }

    getMaturityLevel(score) {
        if (score >= 4.5) return "Excellence - Votre organisation est un leader en matière d'IA";
        if (score >= 3.5) return "Avancé - Bonne maturité avec quelques axes d'amélioration";
        if (score >= 2.5) return "Intermédiaire - Fondations solides, développement en cours";
        if (score >= 1.5) return "Débutant - Premiers pas vers la maturité IA";
        return "Initial - Opportunités significatives de développement";
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;

            // Update UI based on view
            if (viewName === 'audit') {
                // If coming from overview page (through "Commencer l'Audit" button),
                // reset to the first axis
                if (document.getElementById('overview').classList.contains('active')) {
                    this.currentAxis = 0;
                }
                this.renderAuditNavigation();
                this.renderCurrentAxis();
            } else if (viewName === 'review') {
                this.renderReviewContent();
            } else if (viewName === 'overview') {
                // Vérifier si l'utilisateur a déjà répondu à des questions
                this.checkAndShowKPISection();
            }
        }
    }

    renderReviewContent() {
        const container = document.getElementById('review-content');
        if (!container || !this.questionnaire) return;

        const reviewHTML = this.questionnaire.axes.map(axis => {
            const axisScore = this.calculateAxisScore(axis.id);
            const axisCompletion = this.getAxisCompletion(axis.id);
            
            // Get appropriate color based on score
            let scoreClass = '';
            if (axisScore >= 4) scoreClass = 'success';
            else if (axisScore >= 3) scoreClass = 'info';
            else if (axisScore >= 2) scoreClass = 'warning';
            else scoreClass = 'error';
            
            return `
                <div class="review-axis">
                    <div class="review-axis-header">
                        <h3>
                            <i class="fas ${this.getAxisIcon(axis.id)}" aria-hidden="true"></i>
                            ${axis.title}
                        </h3>
                        <div class="review-axis-meta">
                            <span class="axis-score">${axisScore.toFixed(1)}/5</span>
                            <span class="axis-completion">${axisCompletion}% complété</span>
                        </div>
                    </div>
                    <div class="review-subaxes">
                        ${axis.sub_axes.map(subAxis => {
                            // Use the new methods that work with any axis
                            const subAxisScore = this.calculateSubAxisScoreForAxis(axis.id, subAxis.id);
                            const subAxisCompletion = this.getSubAxisCompletionForAxis(axis.id, subAxis.id);
                            
                            // Get appropriate color based on sub-axis score
                            let subScoreClass = '';
                            if (subAxisScore >= 4) subScoreClass = 'success';
                            else if (subAxisScore >= 3) subScoreClass = 'info';
                            else if (subAxisScore >= 2) subScoreClass = 'warning';
                            else subScoreClass = 'error';
                            
                            return `
                                <div class="review-subaxis">
                                    <div class="subaxis-title">${subAxis.title}</div>
                                    <div class="subaxis-meta">
                                        <span class="subaxis-score ${subScoreClass}">${subAxisScore.toFixed(1)}/5</span>
                                        <span class="subaxis-completion">${subAxisCompletion}% complété</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = reviewHTML;
    }
    

    validateAndProceed() {
        // Prevent proceeding if not all questions are answered
        const totalQuestions = this.getTotalQuestions();
        const answeredQuestions = this.getAnsweredQuestions();
        if (answeredQuestions < totalQuestions) {
            // Show toast notification
            const toastContainer = document.getElementById('toast-container');
            if (toastContainer) {
                const toast = document.createElement('div');
                toast.className = 'toast toast-error';
                toast.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Veuillez répondre à toutes les questions avant de générer le rapport.';
                toastContainer.appendChild(toast);
                setTimeout(() => { toast.remove(); }, 4000);
            }
            return;
        }
        // Proceed to insights
        this.showView('insights');
        // Toujours afficher le formulaire d'informations de l'entreprise
        // et générer de nouveaux insights à chaque fois
        // Pré-remplir le formulaire si des informations d'entreprise sont disponibles
        if (this.companyInfo) {
            const companyNameInput = document.getElementById('company-name');
            const companyDescInput = document.getElementById('company-description');
            const companySectorInput = document.getElementById('company-sector');
            const companySizeInput = document.getElementById('company-size');
            if (companyNameInput && this.companyInfo.name) companyNameInput.value = this.companyInfo.name;
            if (companyDescInput && this.companyInfo.description) companyDescInput.value = this.companyInfo.description;
            if (companySectorInput && this.companyInfo.sector) companySectorInput.value = this.companyInfo.sector;
            if (companySizeInput && this.companyInfo.size) companySizeInput.value = this.companyInfo.size;
        }
        // Assurez-vous que le formulaire est visible et les résultats sont cachés
        const companySection = document.getElementById('company-info-section');
        const resultsSection = document.getElementById('results-section');
        if (companySection && resultsSection) {
            companySection.style.display = 'block';
            resultsSection.style.display = 'none';
        }
    }

    exportCSV() {
        // Get current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const formattedTime = currentDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create array for CSV content
        let csvLines = [];
        
        // Add user information at the top
        csvLines.push('Audit de Maturité IA - Rapport CSV');
        csvLines.push(`Date: ${formattedDate}, Heure: ${formattedTime}`);
        csvLines.push('');
        
        // Add company information if available
        csvLines.push('INFORMATIONS DE L\'ENTREPRISE');
        csvLines.push(`Nom: "${this.companyInfo.name || 'Non spécifié'}"`);
        csvLines.push(`Description: "${this.companyInfo.description || 'Non spécifié'}"`);
        csvLines.push(`Secteur: "${this.companyInfo.sector || 'Non spécifié'}"`);
        csvLines.push(`Taille: "${this.companyInfo.size || 'Non spécifié'}"`);
        csvLines.push(`Email: "${this.companyInfo.email || 'Non spécifié'}"`);
        csvLines.push(`Téléphone: "${this.companyInfo.phone || 'Non spécifié'}"`);
        csvLines.push(`Site Web: "${this.companyInfo.website || 'Non spécifié'}"`);
        csvLines.push('');
        
        // Add global score
        const globalScore = this.calculateGlobalScore();
        csvLines.push('SCORE GLOBAL');
        csvLines.push(`Score de maturité: ${globalScore.toFixed(2)}/5`);
        csvLines.push(`Niveau de maturité: ${this.getMaturityLevel(globalScore)}`);
        csvLines.push('');
        
        // Add axis scores
        csvLines.push('SCORES PAR AXE');
        if (this.questionnaire) {
            this.questionnaire.axes.forEach(axis => {
                const axisScore = this.calculateAxisScore(axis.id);
                csvLines.push(`${axis.title}: ${axisScore.toFixed(2)}/5`);
            });
        }
        csvLines.push('');
        
        // Add the regular audit data (questions and responses)
        csvLines.push('DÉTAIL DES RÉPONSES');
        csvLines.push('Axe,Sous-Axe,Question,Score,Notes');
        
        const data = this.prepareExportData();
        data.forEach(row => {
            csvLines.push(`"${row.axe}","${row.sous_axe}","${row.question}",${row.score},"${row.notes}"`);
        });
        
        // Add AI insights at the end
        csvLines.push('');
        csvLines.push('INSIGHTS ET RECOMMANDATIONS');
        
        // Try to get insights content from the DOM
        const insightsContent = document.getElementById('insights-content');
        if (insightsContent) {
            // Clean and format the insights text, preserving line breaks
            const insightsText = insightsContent.innerText
                .split('\n')
                .filter(line => line.trim() !== '') // Éliminer les lignes vides
                .map(line => `"${line.replace(/"/g, '""')}"`);
            
            // Add each line separately
            csvLines.push(...insightsText);
        } else {
            csvLines.push('"Insights non disponibles"');
        }
        
        // Join all lines with newline characters
        const csv = csvLines.join('\n');
        
        // Download the file
        this.downloadFile(csv, `audit-maturite-ia-${formattedDate.replace(/\//g, '-')}.csv`, 'text/csv');
        this.showNotification('Export CSV téléchargé', 'success');
    }

    exportPDF() {
        const element = document.getElementById('results-section');
        const opt = {
            margin: 1,
            filename: 'audit-maturite-ia.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
        this.showNotification('Export PDF généré', 'success');
    }

    copyInsights() {
        const insightsContent = document.getElementById('insights-content');
        if (!insightsContent) return;

        const text = insightsContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Insights copiés dans le presse-papiers', 'success');
        }).catch(() => {
            this.showNotification('Erreur lors de la copie', 'error');
        });
    }

    prepareExportData() {
        const data = [];
        
        this.questionnaire.axes.forEach(axis => {
            axis.sub_axes.forEach(subAxis => {
                subAxis.questions.forEach(question => {
                    const response = this.responses[question.id] || {};
                    data.push({
                        axe: axis.title,
                        sous_axe: subAxis.title,
                        question: question.text,
                        score: response.score || '',
                        notes: response.notes || ''
                    });
                });
            });
        });

        return data;
    }

    convertToCSV(data) {
        const headers = ['Axe', 'Sous-Axe', 'Question', 'Score'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                `"${row.axe}"`,
                `"${row.sous_axe}"`,
                `"${row.question}"`,
                row.score,
            ].join(','))
        ].join('\n');

        return csvContent;
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

   
    showNotification(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}" aria-hidden="true"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// ==================== GLOBAL FUNCTIONS ====================
let app;

// Calcule un hash simple pour détecter les changements dans les réponses
function calculateResponsesHash(responses) {
    // Convertir l'objet de réponses en chaîne JSON puis calculer une somme de contrôle simple
    const responsesStr = JSON.stringify(responses);
    
    // Calculer une somme de contrôle simple
    let hash = 0;
    for (let i = 0; i < responsesStr.length; i++) {
        const char = responsesStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir en entier 32 bits
    }
    
    return hash.toString();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new AuditApp();
});

// Global functions for HTML onclick handlers
function showView(viewName) {
    app.showView(viewName);
}

function startNewAudit() {
    // Reset to the first axis
    app.currentAxis = 0;
    // Show the audit view
    app.showView('audit');
}

function scrollToInfo() {
    // Fonction pour faire défiler vers la section d'information
    const infoSection = document.querySelector('.info-section');
    if (infoSection) {
        infoSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Si aucune section d'information n'existe, défiler vers le bas de la page
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    }
}

function navigateAxis(direction) {
    app.navigateAxis(direction);
}

function setRating(questionId, score) {
    app.setRating(questionId, score);
}

function setNotes(questionId, notes) {
    app.setNotes(questionId, notes);
}

function toggleSubAxis(subAxisId) {
    const header = document.querySelector(`[data-sub-axis="${subAxisId}"] .sub-axis-header`);
    const content = document.getElementById(`content-${subAxisId}`);
    
    if (header && content) {
        const isActive = header.classList.contains('active');
        // Close all other sub-axes
        document.querySelectorAll('.sub-axis-header.active').forEach(h => {
            h.classList.remove('active');
        });
        document.querySelectorAll('.sub-axis-content.active').forEach(c => {
            c.classList.remove('active');
        });
        // Toggle current sub-axis
        if (!isActive) {
            header.classList.add('active');
            content.classList.add('active');
            // Scroll to header when opening
            header.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
    }
}

function validateAndProceed() {
    app.validateAndProceed();
}

function exportCSV() {
    app.exportCSV();
}

function exportPDF() {
    app.exportPDF();
}

function copyInsights() {
    app.copyInsights();
}

// Initializes the country selector without search functionality
document.addEventListener('DOMContentLoaded', function() {
    const phoneCodeSelect = document.getElementById('company-phone-code');
    
    if (phoneCodeSelect) {

        // Add enhanced dropdown functionality to the country code dropdown
        const enhanceSelect = () => {
            // Create a wrapper div
            const wrapper = document.createElement('div');
            wrapper.className = 'country-select-wrapper';
            wrapper.style.position = 'relative';
            
            // Clone select and options
            const selectClone = phoneCodeSelect.cloneNode(true);
            selectClone.style.display = 'none';
            
            // Create a custom dropdown
            const dropdown = document.createElement('div');
            dropdown.className = 'country-dropdown';
            dropdown.style.maxHeight = '300px';
            dropdown.style.overflowY = 'auto';
            dropdown.style.display = 'none';
            dropdown.style.position = 'absolute';
            dropdown.style.width = '230px'; // Increased width for options
            dropdown.style.zIndex = '1000';
            dropdown.style.backgroundColor = 'var(--primary)';
            dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            dropdown.style.borderRadius = '4px';
            dropdown.style.marginTop = '4px';
            dropdown.style.color = '#fff';
            
            // Create the selected display
            const selectedDisplay = document.createElement('div');
            selectedDisplay.className = 'selected-country form-select';
            selectedDisplay.style.display = 'flex';
            selectedDisplay.style.alignItems = 'center';
            selectedDisplay.style.justifyContent = 'space-between';
            selectedDisplay.style.cursor = 'pointer';
            selectedDisplay.style.width = '120px';
            selectedDisplay.style.height = '48px'; // Reduced height
            selectedDisplay.style.padding = '4px 8px'; // Smaller padding
            selectedDisplay.innerHTML = `<span>${phoneCodeSelect.options[phoneCodeSelect.selectedIndex].text}</span><i class="fas fa-chevron-down" style="margin-left: 8px;"></i>`;
            
            // Populate dropdown
            Array.from(phoneCodeSelect.options).forEach((option) => {
                const item = document.createElement('div');
                item.className = 'country-item';
                item.dataset.value = option.value;
                item.textContent = option.text;
                item.style.padding = '6px 12px'; // Reduced vertical padding
                item.style.cursor = 'pointer';
                item.style.fontSize = '14px'; // Slightly smaller font
                
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#0c2a5c';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                });
                
                item.addEventListener('click', () => {
                    selectedDisplay.innerHTML = `<span>${option.text}</span><i class="fas fa-chevron-down" style="margin-left: 8px;"></i>`;
                    phoneCodeSelect.value = option.value;
                    dropdown.style.display = 'none';

                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    phoneCodeSelect.dispatchEvent(event);
                });
                
                dropdown.appendChild(item);
            });
            
            // Toggle dropdown
            selectedDisplay.addEventListener('click', () => {
                const isVisible = dropdown.style.display === 'block';
                dropdown.style.display = isVisible ? 'none' : 'block';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
            
            // Replace select with our custom components
            wrapper.appendChild(selectedDisplay);
            wrapper.appendChild(dropdown);
            phoneCodeSelect.parentNode.insertBefore(wrapper, phoneCodeSelect);
            phoneCodeSelect.style.display = 'none';
        };
        
        // Initialize after a short delay to ensure DOM is fully loaded
        setTimeout(enhanceSelect, 100);
    }
});

// Format phone number as user types (optional enhancement)
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('company-phone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Remove non-digits
            let value = e.target.value.replace(/\D/g, '');
            
            // Limit to 15 digits max
            if (value.length > 15) {
                value = value.slice(0, 15);
            }
            
            // Format the number with spaces for readability (optional)
            // This is a simple formatting example that adds spaces every 3 digits
            if (value.length > 3) {
                value = value.match(/.{1,3}/g).join(' ').trim();
            }
            
            e.target.value = value;
        });
    }
});

// Script to enhance dropdown styling
document.addEventListener('DOMContentLoaded', function() {
    // Get all dropdown elements
    const dropdowns = document.querySelectorAll('.form-select');
    
    // Apply enhanced styling to each dropdown
    dropdowns.forEach(function(dropdown) {
        // Add a custom attribute for styling hooks
        dropdown.setAttribute('data-styled', 'true');
        
        // Apply styling to options when the dropdown is opened
        dropdown.addEventListener('mousedown', function() {
            // Small timeout to allow browser to render the dropdown
            setTimeout(function() {
                const options = dropdown.querySelectorAll('option');
                options.forEach(function(option) {
                    option.style.backgroundColor = '#081d3f';
                    option.style.color = '#fff';
                });
            }, 10);
        });
    });

    // Special handling for the phone code dropdown
    const phoneDropdown = document.getElementById('company-phone-code');
    if (phoneDropdown) {
        // Apply styles immediately and also on change
        const applyStyles = function() {
            const options = phoneDropdown.querySelectorAll('option');
            options.forEach(function(option) {
                option.style.backgroundColor = '#081d3f';
                option.style.color = '#fff';
            });
        };
        
        // Apply initially
        applyStyles();
        
        // Apply when dropdown is clicked
        phoneDropdown.addEventListener('mousedown', applyStyles);
        phoneDropdown.addEventListener('change', applyStyles);
    }
});

