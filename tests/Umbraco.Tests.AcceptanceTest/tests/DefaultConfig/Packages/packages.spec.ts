import {expect} from '@playwright/test';
import {ConstantHelper, test} from '@umbraco/playwright-testhelpers';
import {ContentBuilder, DocumentTypeBuilder, PackageBuilder} from "@umbraco/json-models-builders";

test.describe('Packages', () => {

  const packageName = "TestPackage";
  const rootDocTypeName = "Test document type";
  const nodeName = "1) Home";

  test.beforeEach(async ({page, umbracoApi}) => {
    // TODO: REMOVE THIS WHEN SQLITE IS FIXED
    // Wait so we don't bombard the API
    await page.waitForTimeout(1000);
    await umbracoApi.login();
  });

  async function CreatePackage(umbracoApi, contentId) {
    const packageSave = new PackageBuilder()
      .withId(0)
      .withPackageGuid("00000000-0000-0000-0000-000000000000")
      .withContentNodeId(contentId)
      .withName(packageName)
      .build();

    await umbracoApi.packages.save(packageSave);
  }

  async function CreateSimplePackage(umbracoApi) {
    const rootDocType = new DocumentTypeBuilder()
      .withName(rootDocTypeName)
      .withAllowAsRoot(true)
      .build();

    const generatedRootDocType = await umbracoApi.documentTypes.save(rootDocType);

    const rootDocTypeAlias = generatedRootDocType["alias"];

    const rootContentNode = new ContentBuilder()
      .withContentTypeAlias(rootDocTypeAlias)
      .withAction("saveNew")
      .addVariant()
      .withName(nodeName)
      .withSave(true)
      .done()
      .build();
    const generatedContent = await umbracoApi.content.save(rootContentNode);
    await CreatePackage(umbracoApi, generatedContent.Id);

  }

  test('Deletes a package', async ({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(rootDocTypeName);
    await umbracoApi.packages.ensureNameNotExists(packageName);

    await CreateSimplePackage(umbracoApi);

    // Navigate to create package section
    await umbracoUi.goToSection(ConstantHelper.sections.packages);
    await page.locator('[data-element="sub-view-umbCreatedPackages"]').click()
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.delete));
    await page.waitForTimeout(100);
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey('contentTypeEditor_yesDelete'));

    // Assert
    await expect(await page.locator("tr", {hasText: packageName})).not.toBeVisible();

    // Cleanup
    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(rootDocTypeName);
    await umbracoApi.packages.ensureNameNotExists(packageName);
  });

  test('Download package', async ({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(rootDocTypeName);
    await umbracoApi.packages.ensureNameNotExists(packageName);

    await CreateSimplePackage(umbracoApi);

    // Navigate to package and download
    await umbracoUi.goToSection(ConstantHelper.sections.packages);
    await page.locator('[data-element="sub-view-umbCreatedPackages"]').click();
    await page.locator("tr", {hasText: "TestPackage"}).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.download))
    ]);

    // Assert
    await expect(await download).not.toBeNull();
    await expect(await download.failure()).toBeNull();

    // Cleanup
    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(rootDocTypeName);
    await umbracoApi.packages.ensureNameNotExists(packageName);
  });
});
