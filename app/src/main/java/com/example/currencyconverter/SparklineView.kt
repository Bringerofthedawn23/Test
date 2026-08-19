package com.example.currencyconverter

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.util.AttributeSet
import android.util.TypedValue
import android.view.View

/**
 * Minimal sparkline: draws a smoothed polyline of the given values with a soft
 * fill beneath it and a dot on the latest point. Colors follow the theme's
 * primary color. Nothing is drawn for fewer than two points.
 */
class SparklineView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
) : View(context, attrs, defStyleAttr) {

    private var values: List<Double> = emptyList()

    private val lineColor = resolveColor(
        com.google.android.material.R.attr.colorPrimary, 0xFF3563E9.toInt()
    )

    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = dp(2f)
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        color = lineColor
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        // ~13% alpha of the line color.
        color = (lineColor and 0x00FFFFFF) or (0x22 shl 24)
    }
    private val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = lineColor
    }

    private val linePath = Path()
    private val fillPath = Path()

    fun setValues(newValues: List<Double>) {
        values = newValues
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (values.size < 2) return

        val min = values.minOrNull() ?: return
        val max = values.maxOrNull() ?: return
        val range = (max - min).let { if (it == 0.0) 1.0 else it }

        val padV = dp(6f)
        val w = width.toFloat()
        val h = height.toFloat()
        val stepX = w / (values.size - 1)

        linePath.reset()
        fillPath.reset()

        var lastX = 0f
        var lastY = 0f
        for (i in values.indices) {
            val x = i * stepX
            val norm = ((values[i] - min) / range).toFloat()
            val y = padV + (1f - norm) * (h - 2 * padV)
            if (i == 0) {
                linePath.moveTo(x, y)
                fillPath.moveTo(x, h)
                fillPath.lineTo(x, y)
            } else {
                linePath.lineTo(x, y)
                fillPath.lineTo(x, y)
            }
            lastX = x
            lastY = y
        }
        fillPath.lineTo(lastX, h)
        fillPath.close()

        canvas.drawPath(fillPath, fillPaint)
        canvas.drawPath(linePath, linePaint)
        canvas.drawCircle(lastX, lastY, dp(3f), dotPaint)
    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    private fun resolveColor(attr: Int, fallback: Int): Int {
        val tv = TypedValue()
        return if (context.theme.resolveAttribute(attr, tv, true)) tv.data else fallback
    }
}
