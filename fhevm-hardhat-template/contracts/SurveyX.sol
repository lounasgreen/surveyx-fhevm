// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, ebool, externalEuint32, externalEuint8, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SurveyX - Confidential Survey System
/// @author SurveyX Team
/// @notice A privacy-preserving survey system using FHEVM for encrypted responses
contract SurveyX is SepoliaConfig {
    
    // Survey question types
    enum QuestionType { SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT, RATING }
    
    // Survey structure
    struct Survey {
        address creator;
        string title;
        string description;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
        uint256 questionCount;
        uint256 responseCount;
    }
    
    // Question structure
    struct Question {
        uint256 surveyId;
        QuestionType questionType;
        string questionText;
        string[] options; // For choice questions
        uint8 maxRating; // For rating questions
        bool isRequired;
    }
    
    // Encrypted response structure
    struct EncryptedResponse {
        uint256 surveyId;
        uint256 questionId;
        address respondent;
        euint32 encryptedAnswer; // Encrypted answer value
        uint256 submittedAt;
    }
    
    // Survey statistics (encrypted)
    struct SurveyStats {
        uint256 surveyId;
        euint32 totalResponses;
        mapping(uint256 => euint32) questionStats; // questionId => encrypted count/sum
    }
    
    // State variables
    uint256 private _surveyCounter;
    uint256 private _questionCounter;
    uint256 private _responseCounter;
    
    // Mappings
    mapping(uint256 => Survey) public surveys;
    mapping(uint256 => Question) public questions;
    mapping(uint256 => EncryptedResponse) public responses;
    mapping(uint256 => SurveyStats) private surveyStats;
    mapping(uint256 => uint256[]) public surveyQuestions; // surveyId => questionIds
    mapping(uint256 => uint256[]) public surveyResponses; // surveyId => responseIds
    mapping(address => uint256[]) public userSurveys; // creator => surveyIds
    mapping(address => uint256[]) public userResponses; // respondent => responseIds
    
    // Access control
    mapping(uint256 => mapping(address => bool)) public surveyPermissions; // surveyId => user => hasAccess
    mapping(uint256 => bool) public isPublicSurvey; // surveyId => isPublic
    
    // User participation tracking
    mapping(uint256 => mapping(address => bool)) public hasUserResponded; // surveyId => user => hasStartedResponding
    
    // Events
    event SurveyCreated(uint256 indexed surveyId, address indexed creator, string title);
    event QuestionAdded(uint256 indexed surveyId, uint256 indexed questionId, QuestionType questionType);
    event ResponseSubmitted(uint256 indexed surveyId, uint256 indexed responseId, address indexed respondent);
    event SurveyActivated(uint256 indexed surveyId);
    event SurveyDeactivated(uint256 indexed surveyId);
    event PermissionGranted(uint256 indexed surveyId, address indexed user);
    event PermissionRevoked(uint256 indexed surveyId, address indexed user);
    
    // Modifiers
    modifier onlySurveyCreator(uint256 surveyId) {
        require(surveys[surveyId].creator == msg.sender, "Only survey creator can perform this action");
        _;
    }
    
    modifier surveyExists(uint256 surveyId) {
        require(surveys[surveyId].creator != address(0), "Survey does not exist");
        _;
    }
    
    modifier surveyActive(uint256 surveyId) {
        require(surveys[surveyId].isActive, "Survey is not active");
        require(block.timestamp <= surveys[surveyId].expiresAt, "Survey has expired");
        _;
    }
    
    modifier hasAccess(uint256 surveyId) {
        require(
            surveys[surveyId].creator == msg.sender || 
            isPublicSurvey[surveyId] || 
            surveyPermissions[surveyId][msg.sender],
            "Access denied"
        );
        _;
    }
    
    /// @notice Create a new survey
    /// @param title Survey title
    /// @param description Survey description
    /// @param duration Duration in seconds
    /// @param isPublic Whether the survey is public
    function createSurvey(
        string memory title,
        string memory description,
        uint256 duration,
        bool isPublic
    ) external returns (uint256) {
        _surveyCounter++;
        uint256 surveyId = _surveyCounter;
        
        surveys[surveyId] = Survey({
            creator: msg.sender,
            title: title,
            description: description,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            isActive: false,
            questionCount: 0,
            responseCount: 0
        });
        
        isPublicSurvey[surveyId] = isPublic;
        userSurveys[msg.sender].push(surveyId);
        
        // Initialize encrypted stats
        surveyStats[surveyId].surveyId = surveyId;
        surveyStats[surveyId].totalResponses = FHE.asEuint32(0);
        FHE.allowThis(surveyStats[surveyId].totalResponses);
        
        emit SurveyCreated(surveyId, msg.sender, title);
        return surveyId;
    }
    
    /// @notice Add a question to a survey
    /// @param surveyId Survey ID
    /// @param questionType Type of question
    /// @param questionText Question text
    /// @param options Options for choice questions
    /// @param maxRating Maximum rating for rating questions
    /// @param isRequired Whether the question is required
    function addQuestion(
        uint256 surveyId,
        QuestionType questionType,
        string memory questionText,
        string[] memory options,
        uint8 maxRating,
        bool isRequired
    ) external onlySurveyCreator(surveyId) surveyExists(surveyId) returns (uint256) {
        require(!surveys[surveyId].isActive, "Cannot modify active survey");
        
        _questionCounter++;
        uint256 questionId = _questionCounter;
        
        questions[questionId] = Question({
            surveyId: surveyId,
            questionType: questionType,
            questionText: questionText,
            options: options,
            maxRating: maxRating,
            isRequired: isRequired
        });
        
        surveyQuestions[surveyId].push(questionId);
        surveys[surveyId].questionCount++;
        
        // Initialize encrypted stats for this question
        surveyStats[surveyId].questionStats[questionId] = FHE.asEuint32(0);
        FHE.allowThis(surveyStats[surveyId].questionStats[questionId]);
        
        emit QuestionAdded(surveyId, questionId, questionType);
        return questionId;
    }
    
    /// @notice Activate a survey
    /// @param surveyId Survey ID
    function activateSurvey(uint256 surveyId) external onlySurveyCreator(surveyId) surveyExists(surveyId) {
        require(!surveys[surveyId].isActive, "Survey is already active");
        require(surveys[surveyId].questionCount > 0, "Survey must have at least one question");
        
        surveys[surveyId].isActive = true;
        emit SurveyActivated(surveyId);
    }
    
    /// @notice Deactivate a survey
    /// @param surveyId Survey ID
    function deactivateSurvey(uint256 surveyId) external onlySurveyCreator(surveyId) surveyExists(surveyId) {
        surveys[surveyId].isActive = false;
        emit SurveyDeactivated(surveyId);
    }
    
    /// @notice Submit an encrypted response to a question
    /// @param surveyId Survey ID
    /// @param questionId Question ID
    /// @param encryptedAnswer Encrypted answer
    /// @param inputProof Input proof for the encrypted answer
    function submitResponse(
        uint256 surveyId,
        uint256 questionId,
        externalEuint32 encryptedAnswer,
        bytes calldata inputProof
    ) external surveyExists(surveyId) surveyActive(surveyId) hasAccess(surveyId) {
        require(questions[questionId].surveyId == surveyId, "Question does not belong to this survey");
        
        // Convert external encrypted input to internal encrypted type
        euint32 answer = FHE.fromExternal(encryptedAnswer, inputProof);
        
        _responseCounter++;
        uint256 responseId = _responseCounter;
        
        responses[responseId] = EncryptedResponse({
            surveyId: surveyId,
            questionId: questionId,
            respondent: msg.sender,
            encryptedAnswer: answer,
            submittedAt: block.timestamp
        });
        
        // Set ACL permissions
        FHE.allowThis(answer);
        FHE.allow(answer, msg.sender);
        FHE.allow(answer, surveys[surveyId].creator);
        
        surveyResponses[surveyId].push(responseId);
        userResponses[msg.sender].push(responseId);
        
        // Update survey response count only if this is the user's first response to this survey
        if (!hasUserResponded[surveyId][msg.sender]) {
            hasUserResponded[surveyId][msg.sender] = true;
            surveys[surveyId].responseCount++;
            
            // Update total responses in encrypted stats (only once per user)
            surveyStats[surveyId].totalResponses = FHE.add(
                surveyStats[surveyId].totalResponses,
                FHE.asEuint32(1)
            );
            FHE.allowThis(surveyStats[surveyId].totalResponses);
            FHE.allow(surveyStats[surveyId].totalResponses, surveys[surveyId].creator);
        }
        
        // Update encrypted statistics for this specific question (always)
        surveyStats[surveyId].questionStats[questionId] = FHE.add(
            surveyStats[surveyId].questionStats[questionId],
            answer
        );
        FHE.allowThis(surveyStats[surveyId].questionStats[questionId]);
        FHE.allow(surveyStats[surveyId].questionStats[questionId], surveys[surveyId].creator);
        
        emit ResponseSubmitted(surveyId, responseId, msg.sender);
    }
    
    /// @notice Grant access permission to a user for a private survey
    /// @param surveyId Survey ID
    /// @param user User address
    function grantPermission(uint256 surveyId, address user) external onlySurveyCreator(surveyId) surveyExists(surveyId) {
        surveyPermissions[surveyId][user] = true;
        emit PermissionGranted(surveyId, user);
    }
    
    /// @notice Revoke access permission from a user for a private survey
    /// @param surveyId Survey ID
    /// @param user User address
    function revokePermission(uint256 surveyId, address user) external onlySurveyCreator(surveyId) surveyExists(surveyId) {
        surveyPermissions[surveyId][user] = false;
        emit PermissionRevoked(surveyId, user);
    }
    
    /// @notice Get encrypted statistics for a question (only creator can access)
    /// @param surveyId Survey ID
    /// @param questionId Question ID
    /// @return Encrypted statistics
    function getQuestionStats(uint256 surveyId, uint256 questionId) 
        external 
        view 
        onlySurveyCreator(surveyId) 
        surveyExists(surveyId) 
        returns (euint32) 
    {
        return surveyStats[surveyId].questionStats[questionId];
    }
    
    /// @notice Get total encrypted responses for a survey (only creator can access)
    /// @param surveyId Survey ID
    /// @return Encrypted total responses
    function getTotalResponses(uint256 surveyId) 
        external 
        view 
        onlySurveyCreator(surveyId) 
        surveyExists(surveyId) 
        returns (euint32) 
    {
        return surveyStats[surveyId].totalResponses;
    }
    
    /// @notice Get survey questions
    /// @param surveyId Survey ID
    /// @return Array of question IDs
    function getSurveyQuestions(uint256 surveyId) external view surveyExists(surveyId) returns (uint256[] memory) {
        return surveyQuestions[surveyId];
    }
    
    /// @notice Get user's surveys
    /// @param user User address
    /// @return Array of survey IDs
    function getUserSurveys(address user) external view returns (uint256[] memory) {
        return userSurveys[user];
    }
    
    /// @notice Get user's responses
    /// @param user User address
    /// @return Array of response IDs
    function getUserResponses(address user) external view returns (uint256[] memory) {
        return userResponses[user];
    }
    
    /// @notice Generate random survey ID for sharing (using FHEVM random)
    /// @return Random survey share ID
    function generateShareId() external returns (euint32) {
        euint32 randomId = FHE.randEuint32();
        FHE.allowThis(randomId);
        FHE.allow(randomId, msg.sender);
        return randomId;
    }
    
    /// @notice Get current survey counter
    /// @return Current survey counter
    function getSurveyCounter() external view returns (uint256) {
        return _surveyCounter;
    }
    
    /// @notice Get current question counter
    /// @return Current question counter
    function getQuestionCounter() external view returns (uint256) {
        return _questionCounter;
    }
    
    /// @notice Get current response counter
    /// @return Current response counter
    function getResponseCounter() external view returns (uint256) {
        return _responseCounter;
    }
    
    /// @notice Get question options (separate function for dynamic array)
    /// @param questionId Question ID
    /// @return Array of question options
    function getQuestionOptions(uint256 questionId) external view returns (string[] memory) {
        return questions[questionId].options;
    }
    
    /// @notice Get complete question data (workaround for struct with dynamic array)
    /// @param questionId Question ID
    /// @return surveyId The survey ID this question belongs to
    /// @return questionType The type of question (0=SINGLE_CHOICE, 1=MULTIPLE_CHOICE, 2=TEXT, 3=RATING)
    /// @return questionText The question text
    /// @return maxRating Maximum rating for rating questions
    /// @return isRequired Whether the question is required
    function getQuestionData(uint256 questionId) external view returns (
        uint256 surveyId,
        QuestionType questionType,
        string memory questionText,
        uint8 maxRating,
        bool isRequired
    ) {
        Question storage q = questions[questionId];
        return (q.surveyId, q.questionType, q.questionText, q.maxRating, q.isRequired);
    }
    
    /// @notice Check if a user has responded to a survey
    /// @param surveyId Survey ID
    /// @param user User address
    /// @return Whether the user has started responding to this survey
    function hasUserParticipated(uint256 surveyId, address user) external view returns (bool) {
        return hasUserResponded[surveyId][user];
    }
    
    /// @notice Get unique respondent count for a survey
    /// @param surveyId Survey ID
    /// @return Number of unique users who have responded
    function getUniqueRespondentCount(uint256 surveyId) external view returns (uint256) {
        return surveys[surveyId].responseCount;
    }
}
