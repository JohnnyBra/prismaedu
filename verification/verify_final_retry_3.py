
import asyncio
from playwright.async_api import async_playwright, expect

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        print("Navigating to home...")
        await page.goto("http://localhost:5173")

        # Click "Soy Familia"
        await page.click('text="Soy Familia"')

        # "4º A - Primaria" is the default class name.
        await page.wait_for_selector('text="4º A - Primaria"', timeout=10000)
        await page.click('text="4º A - Primaria"')

        # Click on the first Family
        await page.wait_for_selector('button:has-text("Familia")', timeout=10000)
        await page.locator('button:has-text("Familia")').first.click()

        # Click on a Student
        await page.wait_for_selector('text="Alumno"', timeout=10000)
        await page.locator('button').filter(has_text="Alumno").first.click()

        # PIN 0000
        await page.click('text="0"')
        await page.click('text="0"')
        await page.click('text="0"')
        await page.click('text="0"')
        await page.click('text="Entrar"')

        # Wait for "Profe" BUTTON to appear.
        # Use a more specific locator to avoid ambiguity with text.
        # The Profe button has text "Profe"
        await expect(page.locator('button').filter(has_text="Profe")).to_be_visible()

        await page.screenshot(path="verification/student_dashboard.png")
        print("Student dashboard screenshot taken.")

        # Logout
        await page.locator('.lucide-log-out').first.click()

        # Login Tutor
        await page.click('text="Soy Profesor"')
        await page.click('text="Profesor"')
        await page.click('text="0"')
        await page.click('text="0"')
        await page.click('text="0"')
        await page.click('text="0"')
        await page.click('text="Entrar"')

        try:
            await page.wait_for_selector('text="Prisma Aula"', timeout=5000)
            await page.click('text="Prisma Aula"')
        except:
            pass

        # Wait for "Mensajería"
        await expect(page.get_by_text("Mensajería")).to_be_visible()

        await page.click('text="Mensajería"')

        await page.screenshot(path="verification/tutor_dashboard.png")
        print("Tutor dashboard screenshot taken.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
