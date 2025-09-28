import { expect } from "chai";
import { ethers } from "hardhat";
import { SurveyX } from "../types";
import { Signer } from "ethers";

describe("SurveyX", function () {
  let surveyX: SurveyX;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const SurveyXFactory = await ethers.getContractFactory("SurveyX");
    surveyX = await SurveyXFactory.deploy();
    await surveyX.waitForDeployment();
  });

  describe("Survey Creation", function () {
    it("Should create a new survey", async function () {
      const title = "Test Survey";
      const description = "This is a test survey";
      const duration = 86400; // 1 day
      const isPublic = true;

      const tx = await surveyX.createSurvey(title, description, duration, isPublic);
      const receipt = await tx.wait();

      expect(receipt?.status).to.equal(1);
      
      const surveyId = await surveyX.getSurveyCounter();
      expect(surveyId).to.equal(1);

      const survey = await surveyX.surveys(surveyId);
      expect(survey.creator).to.equal(await owner.getAddress());
      expect(survey.title).to.equal(title);
      expect(survey.description).to.equal(description);
      expect(survey.isActive).to.equal(false);
    });

    it("Should add questions to a survey", async function () {
      // Create survey first
      await surveyX.createSurvey("Test Survey", "Description", 86400, true);
      const surveyId = 1;

      // Add a single choice question
      const questionText = "What is your favorite color?";
      const options = ["Red", "Blue", "Green", "Yellow"];
      
      const tx = await surveyX.addQuestion(
        surveyId,
        0, // SINGLE_CHOICE
        questionText,
        options,
        0, // maxRating not used for choice questions
        true // isRequired
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const questionId = await surveyX.getQuestionCounter();
      expect(questionId).to.equal(1);

      const question = await surveyX.questions(questionId);
      expect(question.surveyId).to.equal(surveyId);
      expect(question.questionText).to.equal(questionText);
      expect(question.isRequired).to.equal(true);
    });

    it("Should activate a survey", async function () {
      // Create survey and add question
      await surveyX.createSurvey("Test Survey", "Description", 86400, true);
      const surveyId = 1;
      
      await surveyX.addQuestion(
        surveyId,
        0, // SINGLE_CHOICE
        "Test Question",
        ["Option 1", "Option 2"],
        0,
        true
      );

      // Activate survey
      const tx = await surveyX.activateSurvey(surveyId);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const survey = await surveyX.surveys(surveyId);
      expect(survey.isActive).to.equal(true);
    });
  });

  describe("Access Control", function () {
    it("Should grant and revoke permissions", async function () {
      // Create private survey
      await surveyX.createSurvey("Private Survey", "Description", 86400, false);
      const surveyId = 1;

      const user1Address = await user1.getAddress();

      // Grant permission
      await surveyX.grantPermission(surveyId, user1Address);
      expect(await surveyX.surveyPermissions(surveyId, user1Address)).to.equal(true);

      // Revoke permission
      await surveyX.revokePermission(surveyId, user1Address);
      expect(await surveyX.surveyPermissions(surveyId, user1Address)).to.equal(false);
    });

    it("Should only allow survey creator to modify survey", async function () {
      await surveyX.createSurvey("Test Survey", "Description", 86400, true);
      const surveyId = 1;

      // Try to add question as non-creator
      await expect(
        surveyX.connect(user1).addQuestion(
          surveyId,
          0,
          "Unauthorized Question",
          ["Option 1"],
          0,
          true
        )
      ).to.be.revertedWith("Only survey creator can perform this action");
    });
  });

  describe("Random Generation", function () {
    it("Should generate random share ID", async function () {
      const tx = await surveyX.generateShareId();
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);
    });
  });

  describe("View Functions", function () {
    it("Should return user surveys", async function () {
      await surveyX.createSurvey("Survey 1", "Description", 86400, true);
      await surveyX.createSurvey("Survey 2", "Description", 86400, true);

      const userSurveys = await surveyX.getUserSurveys(await owner.getAddress());
      expect(userSurveys.length).to.equal(2);
      expect(userSurveys[0]).to.equal(1);
      expect(userSurveys[1]).to.equal(2);
    });

    it("Should return survey questions", async function () {
      await surveyX.createSurvey("Test Survey", "Description", 86400, true);
      const surveyId = 1;

      await surveyX.addQuestion(surveyId, 0, "Question 1", ["A", "B"], 0, true);
      await surveyX.addQuestion(surveyId, 1, "Question 2", ["X", "Y", "Z"], 0, false);

      const questions = await surveyX.getSurveyQuestions(surveyId);
      expect(questions.length).to.equal(2);
      expect(questions[0]).to.equal(1);
      expect(questions[1]).to.equal(2);
    });
  });
});
